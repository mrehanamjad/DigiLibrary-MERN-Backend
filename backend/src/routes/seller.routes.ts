import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createSAccount, createSAccountLink, sellerStripeDashboardLoginUrl } from "../controllers/seller.controller";

const router = Router();

router.use(verifyJWT);

router.route("/account",).post( createSAccount );
router.route("/account-link").post(createSAccountLink)
router.route("/dashboard-link").post(sellerStripeDashboardLoginUrl)


export default router;
