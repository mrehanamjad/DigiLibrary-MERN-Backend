import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose,{ PrePaginatePipelineStage } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../types/user.types";
import { ApiResponse } from "../utils/ApiResponse";
import { Bookmark } from "../models/bookmark.model";
import { Book } from "../models/book.model";
import { getPaginationOptions } from "../utils/helper";

const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const _req = req as AuthRequest;

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new ApiError(400, "Invalid bookId");
  }

  const bookExists = await Book.exists({ _id: bookId, isPublished: true });

  if (!bookExists) {
    throw new ApiError(404, "Book not found");
  }

  const existingBookmark = await Bookmark.findOne({
    userId: _req.user._id,
    bookId,
  });

  if (existingBookmark) {
    await Bookmark.deleteOne({ _id: existingBookmark._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Bookmark removed successfully"));
  }

  const newBookmark = await Bookmark.create({
    userId: _req.user._id,
    bookId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newBookmark, "Book bookmarked successfully"));
});

const getMyBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortType = "asc" } = req.query;
  const _req = req as AuthRequest;

  const aggregationPipeline = [
    {
      $match: { userId: new mongoose.Types.ObjectId(_req.user._id) },
    },
    {
      $sort: { createdAt: sortType === "desc" ? -1 : 1 },
    },
    {
      $lookup: {
        from: "books",
        localField: "bookId",
        foreignField: "_id",
        as: "book",
      },
    },
    { $unwind: "$book" },
    {
      $lookup: {
        from: "users",
        localField: "book.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0, // remove bookmark document id
        book: {
          _id: "$book._id",
          title: "$book.title",
          author: "$book.author",
          price: "$book.price",
          isFree: "$book.isFree",
          category: "$book.category",
          language: "$book.language",
          views: "$book.views",
          isPublished: "$book.isPublished",
          createdAt: "$book.createdAt",
          coverImage: "$book.coverImage",
          user: {
            _id: "$user._id",
            username: "$user.username",
            fullName: "$user.fullName",
            avatar: "$user.avatar",
          },
        },
      },
    },
  ] as PrePaginatePipelineStage[];

  const options = getPaginationOptions(
    Number(page),
    Number(limit),
    "totalBookmarks",
    "bookmarks"
  );

  const result = await Bookmark.aggregatePaginate(aggregationPipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Bookmarks fetched successfully"));
});


export { toggleBookmark, getMyBookmarks };
