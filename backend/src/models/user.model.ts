import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/config";
import { UserI } from "../types/user.types";
import type { StringValue } from "ms";

const userSchema = new mongoose.Schema<UserI>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
    },
    bio: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      url: { type: String, default: "" },
      fileId: { type: String, default: "" }, // imagekit fileId
    },
    coverImage: {
      url: { type: String, default: "" },
      fileId: { type: String, default: "" },
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  const payload = {
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
  };

  const options: SignOptions = {
    expiresIn: config.accessTokenExpiry as StringValue,
  };

  return jwt.sign(payload, config.accessTokenSecret, options);
};

userSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    _id: this._id,
  };

  const options: SignOptions = {
    expiresIn: config.refreshTokenExpiry as StringValue,
  };

  return jwt.sign(payload, config.refreshTokenSecret, options);
};

export const User = mongoose.model<UserI>("User", userSchema);
