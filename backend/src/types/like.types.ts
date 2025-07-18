import mongoose, { Document } from "mongoose";

export interface LikeI extends Document {
    userId: mongoose.Types.ObjectId;
    targetId: mongoose.Types.ObjectId;
    targetType: "Book" | "Comment";
    createdAt: Date;
}
