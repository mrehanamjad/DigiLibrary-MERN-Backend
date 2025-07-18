import mongoose from "mongoose";
import { BookmarkI } from "../types/bookmark.types";


const bookmarkSchema = new mongoose.Schema<BookmarkI>(
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
    },
    {
        timestamps: true,
    },
);

// Prevent duplicate bookmarks by same user
bookmarkSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// indexes for fast lookup
bookmarkSchema.index({ userId: 1 });
bookmarkSchema.index({ bookId: 1 });

export const Bookmark = mongoose.model<BookmarkI>("Bookmark", bookmarkSchema);
