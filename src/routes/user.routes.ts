import { Router } from "express";
import {
    changeEmail,
  changePassword,
  deleteAvatarOrCoverImage,
  deleteUserAccount,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCoverImage,
  updateUserAvatar,
  updateUserProfile,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changePassword);
router.route("/change-email").patch(verifyJWT,changeEmail)
router.route("/update-profile").patch(verifyJWT,updateUserProfile)
router.route("/delete-account").delete(verifyJWT,deleteUserAccount)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route("/:type").delete(verifyJWT,deleteAvatarOrCoverImage)


export default router;
