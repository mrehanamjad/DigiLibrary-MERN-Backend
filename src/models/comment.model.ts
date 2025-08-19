import mongoose, { AggregatePaginateModel } from "mongoose";
import { CommentI } from "../types/comment.types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface CommentModelI extends AggregatePaginateModel<CommentI> {}

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
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
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
commentSchema.index({ replyTo: 1 });

commentSchema.plugin(aggregatePaginate);

export const Comment = mongoose.model<CommentI,CommentModelI>("Comment", commentSchema);




