import express from "express";
import dotenv from "dotenv";
import dbConnect from "./dbConnect.js";
import authRouter from "./routers/authRouter.js";
import postsRouter from "./routers/postsRouter.js";
import userRouter from "./routers/userRouter.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Configuration
cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

//middlewares
app.use(express.json({ limit: "10mb" }));
app.use(morgan("common"));
app.use(cookieParser());
let origin = 'http://localhost:3000';
if (process.env.NODE_ENV === 'production') {
    origin = process.env.CLIENT_ORIGIN;
}
app.use(
    cors({
        credentials: true,
        origin
    })
);

app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/user", userRouter);
app.get("/", (req, res) => {
    res.status(200).send("OK from Server");
});

const PORT = process.env.PORT || 4001;

dbConnect();
app.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`);
});

export default app;
