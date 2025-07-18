import mongoose from "mongoose";
import { LikeI } from "../types/like.types";

const likeSchema = new mongoose.Schema<LikeI>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // dynamic reference to Book or Comment
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Book", "Comment"],
    },
  },
  { timestamps: true }
);

// Prevent duplicate likes on same target by same user
likeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
likeSchema.index({ userId: 1 });
// Fast lookup by target (e.g., all likes on a book/comment)
likeSchema.index({ targetId: 1, targetType: 1 });

export const Like = mongoose.model<LikeI>("Like", likeSchema);
