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
  pages: number;
  language: string;
  views: number;
  downloads: number;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface SortStageI {
  [key: string]: 1 | -1;
}

export interface searchStageI {
  $match?: {$text: { $search: string }}
}

export interface MatchStageI {
  isPublished?: boolean;
  author?: string;
  category?: string;
  userId?: mongoose.Types.ObjectId; 
  isFree?: boolean;
}


export interface GetBooksParams {
  page?: string | number;
  limit?: string | number;
  query?: string;
  sortBy?: string;
  sortType?: "asc" | "desc";
  author?: string;
  category?: string;
  isFree?: string;
  userId?: string;
  owner?: boolean; // true for getOwnerBooks
}