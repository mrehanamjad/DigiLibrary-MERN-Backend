import { Router } from "express";
import { changePassword, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(changePassword)



export default router;
