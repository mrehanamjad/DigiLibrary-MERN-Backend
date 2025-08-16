import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { deleteFileImagekit, uploadOnImageKit } from "../utils/imagekit";
import { Book } from "../models/book.model";
import { AuthRequest } from "../types/user.types";
import { GetBooksParams, MatchStageI, SortStageI } from "../types/book.types";
import mongoose from "mongoose";
import { getPaginationOptions } from "../utils/helper";

interface MulterFileFields {
  coverImage: Express.Multer.File[];
  file: Express.Multer.File[];
}

const getBooks = async ({
  page = 1,
  limit = 10,
  query = "",
  sortBy = "createdAt",
  sortType = "desc",
  author,
  category,
  isFree,
  userId,
  owner = false,
}: GetBooksParams) => {
  const matchStage: MatchStageI = {
    ...(!owner && { isPublished: true }),
    ...(userId && mongoose.Types.ObjectId.isValid(userId)
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : {}),
    ...(category && { category }),
    ...(author && { author }),
    ...(typeof isFree === "string" && { isFree: isFree === "true" }),
  };

  const searchStage =
    query.trim().length > 0
      ? [{ $match: { $text: { $search: query.trim() } } }]
      : [];

  const sortStage: SortStageI = {
    [sortBy]: sortType === "desc" ? -1 : 1,
  };

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
        author: 1,
        price: 1,
        isFree: 1,
        category: 1,
        language: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        coverImage: 1,
        user: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          avatar: "$user.avatar",
        },
      },
    },
  ];

  const options = getPaginationOptions(
    Number(page),
    Number(limit),
    "totalBooks",
    "books"
  );

  return await Book.aggregatePaginate(
    Book.aggregate(aggregationPipeline),
    options
  );
};

const publishABook = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    author,
    price = 0,
    category,
    tags = [],
    language,
    pages,
    isPublished,
  } = req.body;

  if (
    !title ||
    !description ||
    author.length == 0 ||
    !category ||
    isPublished === undefined || 
    !pages
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (Number(price) < 0) {
    throw new ApiError(400, "Invalid price. Price cannot be negative.");
  }

  const files = req.files as unknown as MulterFileFields;
  // We use as unknown as MulterFileFields because req.files is of type any or some incompatible type, and TypeScript doesn’t allow direct casting from an unrelated type (like any[], File[], or Express.Multer.File[]) to MulterFileFields without first casting to unknown.

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
    language,
    pages,
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

const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const _req = req as AuthRequest;

  const {
    title,
    description,
    author,
    price,
        language,
    pages,
    category,
    tags = [],
    isPublished,
  } = req.body;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  if (book.userId.toString() !== _req.user._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized, you are not allowed to update this book"
    );
  }

  const updateFields = {
    title,
    description,
    author,
    price,
        language,
    pages,
    category,
    tags,
    isPublished,
  };

  for (const [key, value] of Object.entries(updateFields)) {
    if (
      typeof value !== "undefined" &&
      JSON.stringify(book[key as keyof typeof book]) !== JSON.stringify(value)
    ) {
      (book[key as keyof typeof book] as any) = value;
      if (key == "price") {
        if (book.price < 0)
          throw new ApiError(400, "Price can not be negative");
        book.isFree = book.price <= 0;
      }
    }
  }

  await book.save();

  return res
    .status(200)
    .json(new ApiResponse(200, book, "Book updated successfully"));
});

const updateBookCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId } = req.params;
    const _req = req as AuthRequest;

    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (book.userId.toString() !== _req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized user");
    }

    const newCoverImageLocalPath = req.file?.path;
    if (!newCoverImageLocalPath) {
      throw new ApiError(400, "Cover image file not found");
    }

    const uploadedCoverImage = await uploadOnImageKit(
      newCoverImageLocalPath,
      req.file?.filename as string,
      true
    );
    if (!uploadedCoverImage) {
      throw new ApiError(500, "Error uploading cover image to ImageKit");
    }

    if (book.coverImage?.fileId) {
      await deleteFileImagekit(book.coverImage.fileId);
    }

    book.coverImage = {
      url: uploadedCoverImage.url,
      fileId: uploadedCoverImage.fileId,
    };

    await book.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(200, book, "Book cover image updated successfully")
      );
  }
);

const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const _req = req as AuthRequest;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  if (book.userId.toString() !== _req.user._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized, you are not allowed to delete this book"
    );
  }

  await deleteFileImagekit(book.coverImage.fileId);
  await deleteFileImagekit(book.file.fileId);

  await book.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Book deleted successfully"));
});

const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
  const result = await getBooks({ ...req.query });

  if (!result.books) {
    throw new ApiError(404, "No books found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Books fetched successfully"));
});

const getOwnerBooks = asyncHandler(async (req: Request, res: Response) => {
  const _req = req as AuthRequest;

  const result = await getBooks({
    ...req.query,
    userId: _req.user?._id,
    owner: true,
  });

  if (!result.books) {
    throw new ApiError(404, "No books found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Your books fetched successfully"));
});

const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;

  if (!bookId) {
    throw new ApiError(400, "Book ID is required");
  }

  const objectId = new mongoose.Types.ObjectId(bookId);

  const book = await Book.aggregate([
    { $match: { _id: objectId } },
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
        language: 1,
        pages: 1,
        category: 1,
        tags: 1,
        views: 1,
        // downloads: 1,
        isPublished: 1,
        createdAt: 1,
        coverImage: 1,
        // file: 1,
        user: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          avatar: "$user.avatar",
        },
      },
    },
  ]);

  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, book[0], "Book fetched successfully"));
});

// TODO: Do it latter
const getBookFile = asyncHandler(async (req: Request, res: Response) => {
  const { bookId } = req.params;

  if (!bookId) {
    throw new ApiError(400, "Book ID is required");
  }

  const book = await Book.findOne({ _id: bookId, isPublished: true });

  if (!book) {
    throw new ApiError(404, "Book not found or not published");
  }


  const objectId = new mongoose.Types.ObjectId(bookId);



})

const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookId } = req.params;
    const _req = req as AuthRequest;

    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (book.userId.toString() !== _req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized user");
    }

    book.isPublished = !book.isPublished;
    book.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          book,
          `Book is now ${book.isPublished ? "published" : "unpublished"}`
        )
      );
  }
);

export {
  publishABook,
  getAllBooks,
  updateBook,
  deleteBook,
  updateBookCoverImage,
  getBookById,
  togglePublishStatus,
  getOwnerBooks,
};

/*
isFree = false // only paid
isFree = true // only free
isFree = null | undefined // both free and paid
*/
