import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createPurchase,  getMyPurchases } from "../controllers/purchase.controller";
const router = Router();

router.use(verifyJWT)


router.route("/").get(getMyPurchases).post(createPurchase);


export default router;
