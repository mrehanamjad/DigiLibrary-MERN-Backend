import { Document } from "mongoose";

export interface UserI extends Document {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  password: string;
  avatar?: string;
  refreshToken?: string;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}
