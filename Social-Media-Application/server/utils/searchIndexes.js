import User from "../models/User.js";
import Post from "../models/Post.js";

// Full-text indexes that power GET /api/search.
// A collection can only have one text index, so the specs live here and are
// created explicitly (createIndex is a no-op when an identical index exists).
export const USER_TEXT_INDEX = {
    keys: { name: "text", bio: "text" },
    options: { name: "user_search_text", weights: { name: 10, bio: 2 }, default_language: "english" },
};

export const POST_TEXT_INDEX = {
    keys: { caption: "text" },
    options: { name: "post_search_text", weights: { caption: 5 }, default_language: "english" },
};

let indexesPromise = null;

// Idempotent and memoised: safe to call on every cold start and before every search.
export function ensureSearchIndexes() {
    if (!indexesPromise) {
        indexesPromise = Promise.all([
            User.collection.createIndex(USER_TEXT_INDEX.keys, USER_TEXT_INDEX.options),
            Post.collection.createIndex(POST_TEXT_INDEX.keys, POST_TEXT_INDEX.options),
            Post.collection.createIndex({ createdAt: -1 }, { name: "post_created_at" }),
        ])
            .then((names) => {
                console.log("Search indexes ready:", names.join(", "));
                return true;
            })
            .catch((e) => {
                // Let the next request retry instead of caching the failure forever.
                indexesPromise = null;
                console.log("Could not create search indexes:", e.message);
                throw e;
            });
    }
    return indexesPromise;
}
