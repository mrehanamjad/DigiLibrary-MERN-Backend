import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const allowedBookTypes = ["application/pdf"];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.fieldname === "coverImage" || file.fieldname === "avatar") {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid ${file.fieldname} type`));
    }
  } else if (file.fieldname === "file") {
    if (allowedBookTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid book file type. Only PDF is allowed."));
    }
  } else {
    cb(new Error("Unknown file field"));
  }
};

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

// General limits (enforced per file by Multer)
const limits = {
  fileSize: 20 * 1024 * 1024, // Max 20MB per file
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
