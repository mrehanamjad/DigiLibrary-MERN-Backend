import mongoose from "mongoose";
import { CommentI } from "../types/comment.types";

const commentSchema = new mongoose.Schema<CommentI>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);


commentSchema.index({ bookId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1 });


export const Comment = mongoose.model<CommentI>("Comment", commentSchema);
