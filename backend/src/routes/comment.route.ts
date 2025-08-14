import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addComment, deleteComment, getBookComments, getReplies, updateComment } from "../controllers/comment.controller";

const router = Router();

router.route('/:bookId').get(getBookComments).post(verifyJWT,addComment)
router.route('/:commentId/replies').get(getReplies)
router.route('/:commentId').delete(verifyJWT,deleteComment).patch(verifyJWT,updateComment)

export default router;