import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {  getMyBookmarks, toggleBookmark } from "../controllers/bookmark.controller";

const router = Router();

router.use(verifyJWT);


router.route("/").get(getMyBookmarks);
router.route("/:bookId").post(toggleBookmark)

export default router;