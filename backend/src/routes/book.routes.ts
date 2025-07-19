import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { getAllBooks, publishABook } from "../controllers/book.controller";

const router = Router();

router.route("/").get(getAllBooks).post(
  verifyJWT,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "coverImage", maxCount: 1, },
  ]),
  publishABook
);

export default router;