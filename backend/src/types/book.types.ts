import mongoose, { Document } from "mongoose";

export interface FileObject {
  url: string;
  fileId: string;
}

export interface BookI extends Document {
  title: string;
  description: string;
  author: string[];
  coverImage: FileObject;
  file: FileObject;
  price: number;
  isFree: boolean;
  userId: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  views: number;
  downloads: number;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface SortObjectI {
  [key: string]: 1 | -1;
}

export interface FindObjectI {
  $text?: { $search: string };
  author?: string;
  category?: string;
  userId?: string; 
  isFree?: boolean;
}