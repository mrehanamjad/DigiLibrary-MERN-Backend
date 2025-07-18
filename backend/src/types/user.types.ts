import { Request } from "express";
import { Document } from "mongoose";

export interface UserI extends Document {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  password: string;
  bio?: string;
  avatar?: {
    url: string;
    fileId: string;
  };
  coverImage?: {
    url: string;
    fileId: string;
  };
  refreshToken?: string;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

type responseUserI = Omit<UserI, "password" | "refreshToken">;

export interface AuthRequest extends Request {
  user: responseUserI;
}
