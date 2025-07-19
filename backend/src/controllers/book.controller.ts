import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadOnImageKit } from "../utils/imagekit";
import { Book } from "../models/book.model";
import { AuthRequest } from "../types/user.types";
import { MatchStageI, SortStageI } from "../types/book.types";
import mongoose from "mongoose";

interface MulterFileFields {
  coverImage: Express.Multer.File[];
  file: Express.Multer.File[];
}

const publishABook = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    author,
    price,
    category,
    tags = [],
    isPublished,
  } = req.body;

  if (
    !title ||
    !description ||
    author.length == 0 ||
    price === undefined ||
    !category ||
    isPublished === undefined
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const files = req.files as unknown as MulterFileFields;

  const coverImageLocalPath = files.coverImage[0].path;
  const fileLocalPath = files.file[0].path;

  if (!coverImageLocalPath || !fileLocalPath) {
    throw new ApiError(400, "Cover image and book file are required");
  }

  // Upload to ImageKit
  const coverImageUploadedOnImagekit = await uploadOnImageKit(
    coverImageLocalPath,
    files.coverImage[0].filename,
    true
  );

  const fileUploadedOnImagekit = await uploadOnImageKit(
    fileLocalPath,
    files.file[0].filename,
    false
  );

  if (!coverImageUploadedOnImagekit || !fileUploadedOnImagekit) {
    throw new ApiError(500, "Error uploading files to ImageKit");
  }

  const _req = req as AuthRequest;

  const newBook = await Book.create({
    title,
    description,
    author,
    price,
    isFree: Number(price) === 0,
    userId: _req.user._id,
    category,
    tags,
    isPublished,
    coverImage: {
      url: coverImageUploadedOnImagekit.url,
      fileId: coverImageUploadedOnImagekit.fileId,
    },
    file: {
      url: fileUploadedOnImagekit.url,
      fileId: fileUploadedOnImagekit.fileId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newBook, "Book published successfully"));
});

const updateBook = asyncHandler(async (req: Request, res: Response) => {});
const deleteBook = asyncHandler(async (req: Request, res: Response) => {});

// const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
//   const {
//     page = 1,
//     limit = 10,
//     query = "",
//     sortBy = "createdAt",
//     sortType = "desc",
//     author,
//     category,
//     isFree,
//     userId,
//   } = req.query;

//   const skipItems = (Number(page) - 1) * Number(limit);
//   const limitItems = Number(limit);

//   // Match conditions for filters
//   const matchStage: MatchStageI = {
//     isPublished: true,
//     ...(userId &&
//       typeof userId === "string" && {
//         userId: new mongoose.Types.ObjectId(userId),
//       }),
//     ...(category && typeof category === "string" && { category }),
//     ...(author && typeof author === "string" && { author }),
//     ...(typeof isFree === "string" && { isFree: isFree === "true" }),
//   };

//   console.log("match stage", matchStage);

//   // Optional full-text search
//   const searchStage =
//     typeof query === "string" && query.trim().length > 0
//       ? [{ $match: { $text: { $search: query.trim() } } }]
//       : [];

//   // Sorting object
//   const sortStage: SortStageI = {};
//   sortStage[sortBy as string] = sortType === "desc" ? -1 : 1;

//   const books = await Book.aggregate([
//     ...searchStage,
//     { $match: matchStage },
//     { $sort: sortStage },
//     { $skip: skipItems },
//     { $limit: limitItems },
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "_id",
//         as: "user",
//       },
//     },
//     { $unwind: "$user" },
//     {
//       $project: {
//         title: 1,
//         description: 1,
//         author: 1,
//         price: 1,
//         isFree: 1,
//         category: 1,
//         tags: 1,
//         views: 1,
//         downloads: 1,
//         isPublished: 1,
//         createdAt: 1,
//         coverImage: 1,
//         file: 1,
//         user: {
//           _id: "$user._id",
//           username: "$user.username",
//           fullName: "$user.fullName",
//         },
//       },
//     },
//   ]);

//   if (!books) {
//     throw new ApiError(404, "No books found");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, books, "Books fetched successfully"));
// });

const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    author,
    category,
    isFree,
    userId,
  } = req.query;

  // Match conditions for filters
  const matchStage: MatchStageI = {
    isPublished: true,
    ...(userId &&
      typeof userId === "string" && {
        userId: new mongoose.Types.ObjectId(userId),
      }),
    ...(category && typeof category === "string" && { category }),
    ...(author && typeof author === "string" && { author }),
    ...(typeof isFree === "string" && { isFree: isFree === "true" }),
  };

  console.log("match stage", matchStage);

  // Optional full-text search
  const searchStage =
    typeof query === "string" && query.trim().length > 0
      ? [{ $match: { $text: { $search: query.trim() } } }]
      : [];

  // Sorting object
  const sortStage: SortStageI = {};
  sortStage[sortBy as string] = sortType === "desc" ? -1 : 1;

  // Build the aggregation pipeline
  const aggregationPipeline = [
    ...searchStage,
    { $match: matchStage },
    { $sort: sortStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        title: 1,
        description: 1,
        author: 1,
        price: 1,
        isFree: 1,
        category: 1,
        tags: 1,
        views: 1,
        downloads: 1,
        isPublished: 1,
        createdAt: 1,
        coverImage: 1,
        file: 1,
        user: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
        },
      },
    },
  ];

  // Pagination options
  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      totalDocs: 'totalBooks',
      docs: 'books',
      limit: 'limit',
      page: 'currentPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
      totalPages: 'totalPages',
      pagingCounter: 'pagingCounter',
      meta: 'pagination',
    },
  };

  // Use aggregatePaginate
  const result = await Book.aggregatePaginate(
    Book.aggregate(aggregationPipeline),
    options
  );

  if (!result.books) {
    throw new ApiError(404, "No books found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Books fetched successfully"));
});

const getBookById = asyncHandler(async (req: Request, res: Response) => {});

export { publishABook,getAllBooks };

/*
isFree = false // only paid
isFree = true // only free
isFree = null | undefined // both free and paid
*/
