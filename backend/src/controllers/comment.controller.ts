import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import mongoose, { PrePaginatePipelineStage } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const getBookComments = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const { page = 1, limit = 10, sortType = "desc" } = req.query;

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new ApiError(400, "Invalid bookId");
  }

  const aggregationPipeline = [
    {
      $match: {
        bookId: new mongoose.Types.ObjectId(bookId),
        parentCommentId: null, 
      },
    },
    {
      $sort: { createdAt: sortType === "desc" ? -1 : 1 },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "comments",
        let: { parentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$parentCommentId", "$$parentId"] },
            },
          },
          {
            $count: "replyCount",
          },
        ],
        as: "replies",
      },
    },
    {
      $addFields: {
        replyCount: {
          $cond: [
            { $gt: [{ $size: "$replies" }, 0] },
            { $arrayElemAt: ["$replies.replyCount", 0] },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        text: 1,
        createdAt: 1,
        parentCommentId: 1,
        replyCount: 1,
        user: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          avatar: "$user.avatar",
        },
      },
    },
  ] as  PrePaginatePipelineStage[];

  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      totalDocs: "totalComments",
      docs: "comments",
      limit: "limit",
      page: "currentPage",
      nextPage: "nextPage",
      prevPage: "prevPage",
      totalPages: "totalPages",
      pagingCounter: "pagingCounter",
      meta: "pagination",
    },
  };

  const result = await Comment.aggregatePaginate(aggregationPipeline, options);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched successfully"));
});


const addComment = asyncHandler(async (req: Request, res: Response) => {
  
});

const updateComment = asyncHandler(async (req: Request, res: Response) => {
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
});

export { getBookComments, addComment, updateComment, deleteComment };
