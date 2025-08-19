import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { stripeWebhook } from "./controllers/purchase.controller";

const app = express();


app.post("/api/v1/purchase/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes";
import bookRouter from "./routes/book.routes";
import commentRouter from "./routes/comment.route";
import bookmarkRouter from './routes/bookmark.routes'
import sellerRoute from './routes/seller.routes'
import purchaseRouter from './routes/purchase.routes'

// routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/comments", commentRouter);
app.use('/api/v1/bookmarks',bookmarkRouter)
app.use('/api/v1/purchase',purchaseRouter)
app.use('/api/v1/sellers',sellerRoute)


export { app };








