import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadOnImageKit } from "../utils/imagekit";
import { Book } from "../models/book.model";
import { AuthRequest } from "../types/user.types";
import { FindObjectI, SortObjectI } from "../types/book.types";

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

export const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    author,
    category,
    isFree, // "true" or "false"
    userId,
  } = req.query;

  const skipItems = (Number(page) - 1) * Number(limit);
  const limitItems = Number(limit);

  const findObj: FindObjectI = {};
  if (typeof query === "string" && query.trim().length > 0) {
    findObj.$text = { $search: query.trim() };
  }
  if (userId && typeof userId === "string") findObj.userId = userId;
  if (category && typeof category === "string") findObj.category = category;
  if (author && typeof author === "string") findObj.author = author;
  if (typeof isFree === "string") {
    findObj.isFree = isFree === "true";
  }

  // Sorting
  const sortObj: SortObjectI = {};
  sortObj[sortBy as string] = sortType === "desc" ? -1 : 1;

  console.log("find Obj: ", findObj);

  const books = await Book.find(findObj)
    .sort(sortObj)
    .skip(skipItems)
    .limit(limitItems)
    .lean();

  if (!books) {
    throw new ApiError(404, "No books found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, books, "Books fetched successfully"));
});

const getBookById = asyncHandler(async (req: Request, res: Response) => {});

export { publishABook };

/*
isFree = false // only paid
isFree = true // only free
isFree = null | undefined // both free and paid
*/
