import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes";
import bookRouter from "./routes/book.routes";




// routes declaration

app.use("/api/v1/users", userRouter); 
app.use("/api/v1/books",bookRouter)

export { app };
