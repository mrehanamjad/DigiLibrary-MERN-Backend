import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
  deleteBook,
  getAllBooks,
  getBookById,
  publishABook,
  updateBook,
  updateBookCoverImage,
} from "../controllers/book.controller";

const router = Router();

router
  .route("/")
  .get(getAllBooks)
  .post(
    verifyJWT,
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "coverImage", maxCount: 1 },
    ]),
    publishABook
  );

router
  .route("/:bookId")
  .get(getBookById)
  .delete(verifyJWT, deleteBook)
  .patch(verifyJWT, updateBook);

router
  .route("/:bookId/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateBookCoverImage);

export default router;
