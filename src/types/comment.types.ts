import mongoose, { Document } from "mongoose";

export interface CommentI extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  text: string;
  parentCommentId?: mongoose.Types.ObjectId | null;
  replyTo?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
