import { NextFunction, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "../models/user.model";
import { AuthRequest } from "../types/user.types";


export const verifyJWT = asyncHandler(
    async (req: Request, _, next: NextFunction) => {
        const token =
            req.cookies.accessToken ||
            req.header("Authorization")?.replace("Bearer", "").trim();

        if (!token) {
            throw new ApiError(401, "Unauthorized: Token not provided");
        }

        const decodedToken = jwt.verify(
            token,
            config.accessTokenSecret,
        ) as JwtPayload;

        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken",
        );

        if (!user) {
            throw new ApiError(401, "Unauthorized: Invalid Access Token");
        }

        const _req = req as AuthRequest;
        _req.user = user;

        next();
    },
);
