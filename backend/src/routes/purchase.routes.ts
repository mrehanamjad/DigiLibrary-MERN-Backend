import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createPurchase } from "../controllers/purchase.controller";
const router = Router();


// Create a new purchase (free or paid)
router.route("/create").post(verifyJWT,createPurchase);


export default router;
