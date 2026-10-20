import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dbConnect from "./dbConnect.js";
import authRouter from "./routers/authRouter.js";
import postsRouter from "./routers/postsRouter.js";
import userRouter from "./routers/userRouter.js";
import apiRouter from "./routers/apiRouter.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// A stray promise rejection or exception must not take the whole function down.
process.on("unhandledRejection", (reason) => {
    console.log("Unhandled rejection:", reason instanceof Error ? reason.message : reason);
});
process.on("uncaughtException", (err) => {
    console.log("Uncaught exception:", err.message);
});

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

// CORS configuration for local dev and Vercel deployments
// Reflects the request origin so cookies can still work without an env allowlist.
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Every route below needs MongoDB: wait for the (cached) connection, or answer 503.
app.use(async (req, res, next) => {
    if (req.method === "OPTIONS" || req.path === "/" || req.path === "/health") {
        return next();
    }
    try {
        await dbConnect();
        return next();
    } catch (e) {
        return res.status(503).json({ status: "error", statusCode: 503, message: "Database unavailable, please retry" });
    }
});

app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/user", userRouter);
app.use("/api", apiRouter);
// On Vercel the function is frozen between requests, so a cold instance may still be
// connecting; give the shared connection attempt a few seconds before answering.
app.get("/health", async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        await Promise.race([
            dbConnect().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 9000)),
        ]);
    }
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable", database: ready ? "connected" : "disconnected" });
});
app.get("/", (req, res) => {
    res.status(200).send("OK from Server");
});

const PORT = process.env.PORT || 4001;

// Start connecting early; requests still await it. Errors are handled per request.
dbConnect().catch(() => {});

// On Vercel the exported app is the handler; only listen when run directly.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`listening on port: ${PORT}`);
    });
}

export default app;
