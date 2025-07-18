import mongoose, {  Document } from "mongoose";


export interface BookmarkI extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}