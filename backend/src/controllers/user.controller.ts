import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    // get user data from frontend (req.body)
    // validation - not emplty, valid email, password length, etc.
    // check if user already exists: username , email
    // check for images , check for avatar image
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // chech for user craetion
    // return response with user data

    const { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists",
        );
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    ); // Exclude password and refreshToken from the response

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200,createdUser, "User registered successfully"),
        );
});


export {registerUser}
