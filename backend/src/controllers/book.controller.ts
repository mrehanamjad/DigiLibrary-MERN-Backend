import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { deleteFileImagekit, uploadOnImageKit } from "../utils/imagekit";
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
    price = 0,
    category,
    tags = [],
    isPublished,
  } = req.body;

  if (
    !title ||
    !description ||
    author.length == 0 ||
    !category ||
    isPublished === undefined
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
        if (book.price < 0) throw new ApiError(400, "Price can not be negative");
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
          avatar: "$user.avatar",
        },
      },
    },
  ];

  // Pagination options
  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      totalDocs: "totalBooks",
      docs: "books",
      limit: "limit",
      page: "currentPage",
      nextPage: "nextPage",
      prevPage: "prevPage",
      totalPages: "totalPages",
      pagingCounter: "pagingCounter",
      meta: "pagination",
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



export {
  publishABook,
  getAllBooks,
  updateBook,
  deleteBook,
  updateBookCoverImage,
  getBookById,
};

/*
isFree = false // only paid
isFree = true // only free
isFree = null | undefined // both free and paid
*/
