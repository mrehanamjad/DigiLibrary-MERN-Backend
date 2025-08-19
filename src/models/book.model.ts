import mongoose, { AggregatePaginateModel } from "mongoose";
import { BookI } from "../types/book.types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface BookModelI extends AggregatePaginateModel<BookI> {}

const fileObjectSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "URL is required"],
      default: "",
    },
    fileId: {
      type: String,
      required: [true, "File ID is required"],
      default: "",
    },
  },
  { _id: false } // Prevents _id creation for subdocuments
);

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
      trim: true,
    },
    author: {
      type: [String],
      required: [true, "Author name is required"],
    },
    coverImage: {
      type: fileObjectSchema,
      required: true,
    },
    file: {
      type: fileObjectSchema,
      required: true,
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
    pages: {
      type: Number,
    },
    language: {
      type: String,
      default: "English",
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

// Indexes for search and filters
bookSchema.index({
  title: "text",
  description: "text",
  author: "text",
  tags: "text",
});

bookSchema.index({ category: 1 });
bookSchema.index({ userId: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ isFree: 1 });
bookSchema.index({ isPublished: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ views: -1 });
bookSchema.index({ downloads: -1 });
bookSchema.index({ createdAt: -1 });

// Plugin
bookSchema.plugin(aggregatePaginate);

export const Book = mongoose.model<BookI, BookModelI>("Book", bookSchema);
