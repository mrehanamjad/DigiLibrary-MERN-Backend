import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
  deleteBook,
  getAllBooks,
  getBookById,
  getOwnerBooks,
  publishABook,
  togglePublishStatus,
  updateBook,
  updateBookCoverImage,
} from "../controllers/book.controller";

const router = Router();

router.route("/my").get(verifyJWT,getOwnerBooks);

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

router.route("/:bookId/toggle-publish").patch(verifyJWT, togglePublishStatus);


export default router;
