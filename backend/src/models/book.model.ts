import mongoose from "mongoose";
import { BookI } from "../types/book.types";

const bookSchema = new mongoose.Schema<BookI>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image URL is required"],
    },
    file: {
      type: String,
      required: [true, "Book file URL is required"],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


bookSchema.index({ title: "text", description: "text", author: "text", tags: "text" }); // Full-text search
bookSchema.index({ category: 1 });
bookSchema.index({ userId: 1 });
bookSchema.index({ isFree: 1 });
bookSchema.index({ isPublished: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ views: -1 });
bookSchema.index({ downloads: -1 });
bookSchema.index({ createdAt: -1 });

export const Book = mongoose.model<BookI>("Book", bookSchema);
