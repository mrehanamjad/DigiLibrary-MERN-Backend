import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import mongoose, { PrePaginatePipelineStage } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../types/user.types";
import { getPaginationOptions } from "../utils/helper";

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
  ] as PrePaginatePipelineStage[];

  const options = getPaginationOptions(Number(page),Number(limit),"totalComments","comments")

  const result = await Comment.aggregatePaginate(aggregationPipeline, options);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched successfully"));
});

const getReplies = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10, sortType = "asc" } = req.query;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const aggregationPipeline = [
    {
      $match: {
        parentCommentId: new mongoose.Types.ObjectId(commentId),
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
      $project: {
        _id: 1,
        text: 1,
        createdAt: 1,
        parentCommentId: 1,
        replyTo: 1,
        user: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          avatar: "$user.avatar",
        },
      },
    },
  ] as PrePaginatePipelineStage[];

  const options = getPaginationOptions(Number(page),Number(limit),"totalReplies","replies")

  const result = await Comment.aggregatePaginate(aggregationPipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Replies fetched successfully"));
});


const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;

  const { text, replyTo, parentCommentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw new ApiError(400, "Invalid bookId");
  }

  if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId)) {
    throw new ApiError(400, "Invalid parentCommentId");
  }

  if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
    throw new ApiError(400, "Invalid replyTo comment id");
  }

  if (!text || text.trim().length === 0) {
    throw new ApiError(400, "Comment text is required");
  }

  const _req = req as AuthRequest;
  const comment = await Comment.create({
    userId: _req.user._id,
    bookId,
    text,
    replyTo,
    parentCommentId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  if (!text || text.trim().length === 0 ) {
    throw new ApiError(400, "Comment text is required");
  }
  
  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }
  
  const _req = req as AuthRequest;
  if(comment.userId.toString() !== _req.user._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized, you are not allowed to update this Comment"
    );
  }

  comment.text = text.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }
  
  const _req = req as AuthRequest;
  if(comment.userId.toString() !== _req.user._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized user"
    );
  }

  await Comment.deleteMany({
    $or: [
      { _id: comment._id },
      { parentCommentId: comment._id },
    ],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment and its replies deleted successfully"));
});

export { getBookComments, addComment, updateComment, deleteComment, getReplies };
