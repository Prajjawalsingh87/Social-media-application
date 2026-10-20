import mongoose from "mongoose";
import { ensureSearchIndexes } from "./utils/searchIndexes.js";

// One shared connection promise: concurrent callers (startup, /health) wait on the same attempt.
let connectionPromise = null;

export default () => {
    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoUri = process.env.MONGODB_URI;
    console.log("Attempting to connect to MongoDB with URI:", mongoUri ? mongoUri.replace(/:.+@/, ":****@") : "UNDEFINED");

    connectionPromise = mongoose
        .connect(mongoUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
        .then((connect) => {
            console.log(`MongoDB connected: ${connect.connection.host}`);
            // Fire and forget: search waits on the same promise if it is still running.
            ensureSearchIndexes().catch(() => {});
            return connect;
        })
        .catch((error) => {
            console.log("MongoDB connection error:", error.message);
            process.exit(1);
        });

    return connectionPromise;
};
