import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import { UserI } from "../types/user.types";
import { AuthRequest } from "../types/user.types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";
import { deleteFileImagekit, uploadOnImageKit } from "../utils/imagekit";

const generateAccessAndRefreshTokens = async (user: UserI) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Error generating access and refresh tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User with this email  already exists");
  }

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // Exclude password and refreshToken from the response

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne<UserI>({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Failed to retrieve user details after login");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  await User.findByIdAndUpdate(
    _req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incommingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incommingRefreshToken,
    config.refreshTokenSecret
  ) as JwtPayload;

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.refreshToken !== incommingRefreshToken) {
    throw new ApiError(401, "Refresh tocken is expired or used");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access token refreshed successfully"
      )
    );
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(_req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const changeEmail = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findById(_req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  user.email = email;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email changed successfully"));
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  return res
    .status(200)
    .json(new ApiResponse(200, _req.user, "Current user fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const { username, fullName, bio } = req.body;

  if (!username || !fullName || !bio) {
    throw new ApiError(400, "fullName ,username & bio fields are required");
  }

  const user = await User.findByIdAndUpdate(
    _req.user?._id,
    {
      $set: { username, fullName, bio },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnImageKit(
    avatarLocalPath,
    req.file?.filename as string,
    true
  );

  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    _req.user?._id,
    {
      $set: {
        avatar: { url: avatar?.url, fileId: avatar?.fileId },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  await deleteFileImagekit(_req.user.avatar?.fileId as string);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateCoverImage = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnImageKit(
    coverImageLocalPath,
    req.file?.filename as string,
    true
  );

  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(
    _req.user?._id,
    {
      $set: {
        coverImage: { url: coverImage?.url, fileId: coverImage?.fileId },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  await deleteFileImagekit(_req.user.coverImage?.fileId as string);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const deleteAvatarOrCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { type } = req.params;

    console.log("params",type)

    if (!["avatar", "cover-image"].includes(type)) {
      throw new ApiError(
        400,
        "Invalid image type. Must be 'avatar' or 'cover-image'"
      );
    }

    const typeDB = type === "avatar" ? "avatar" : "coverImage";

    const _req = req as AuthRequest;
    const fileId = _req.user[typeDB]?.fileId;

    if (!fileId) {
      throw new ApiError(404, `${type} not found or already deleted`);
    }

    await deleteFileImagekit(fileId);

    const updatedUser = await User.findByIdAndUpdate(
      _req.user._id,
      {
        $set: {
          [typeDB]: { url: "", fileId: "" },
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, `${type} removed successfully`));
  }
);

const deleteUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required to delete the account");
  }

  const _req = req as AuthRequest;
  const user = await User.findById(_req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid =  await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password");
  }

  await User.findByIdAndDelete(_req.user._id);

  // Clear refresh token cookie if used
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User account deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  changeEmail,
  getCurrentUser,
  updateUserProfile,
  updateUserAvatar,
  updateCoverImage,
  deleteAvatarOrCoverImage,
  deleteUserAccount,
};
