import mongoose, { AggregatePaginateModel } from "mongoose";
import { BookmarkI } from "../types/bookmark.types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface BookmarkModelI extends AggregatePaginateModel<BookmarkI> {}

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

bookmarkSchema.plugin(aggregatePaginate);

export const Bookmark = mongoose.model<BookmarkI,BookmarkModelI>("Bookmark", bookmarkSchema);
