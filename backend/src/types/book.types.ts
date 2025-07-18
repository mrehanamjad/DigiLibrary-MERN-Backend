import mongoose, { Document } from "mongoose";

export interface BookI extends Document {
  title: string;
  description: string;
  author: string;
  coverImage: string;
  file: string;
  price: number;
  isFree: boolean;
  userId: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  views: number;
  downloads: number;
  isPublished: boolean;
}