import mongoose from "mongoose";
import { ensureSearchIndexes } from "./utils/searchIndexes.js";

// Serverless-friendly MongoDB connection.
// - The connection promise lives on globalThis, so warm invocations of the same
//   function instance reuse it instead of reconnecting.
// - Every request awaits it (see the middleware in index.js) rather than relying on a
//   connect that started at boot and may have been frozen with the instance.
// - A failed attempt is forgotten so the next request retries; it never exits the process.
const cache = globalThis.__orbitMongo || (globalThis.__orbitMongo = { promise: null });

const CONNECT_OPTIONS = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 8000, // fail fast instead of hanging until Vercel kills the function
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5, // many small instances: keep each one's pool small
    minPoolSize: 0,
};

export default function dbConnect() {
    if (mongoose.connection.readyState === 1 && cache.promise) {
        return cache.promise;
    }
    if (cache.promise) {
        return cache.promise;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        return Promise.reject(new Error("MONGODB_URI is not set"));
    }
    console.log("Connecting to MongoDB:", mongoUri.replace(/:\/\/[^@]*@/, "://****@"));

    cache.promise = mongoose
        .connect(mongoUri, CONNECT_OPTIONS)
        .then((connect) => {
            console.log(`MongoDB connected: ${connect.connection.host}`);
            // Fire and forget: search waits on the same promise if it is still running.
            ensureSearchIndexes().catch(() => {});
            return connect;
        })
        .catch((error) => {
            console.log("MongoDB connection error:", error.message);
            cache.promise = null; // let the next request try again
            throw error;
        });

    return cache.promise;
}

// If the driver drops the connection later, start fresh on the next request.
if (!cache.listening) {
    cache.listening = true;
    mongoose.connection.on("disconnected", () => {
        cache.promise = null;
    });
}
