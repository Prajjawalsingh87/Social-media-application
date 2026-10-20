import mongoose from "mongoose";

// Opaque cursor for newest-first lists sorted by (createdAt desc, _id desc).
export function encodeCursor(doc) {
    if (!doc) return null;
    const raw = `${new Date(doc.createdAt).toISOString()}|${doc._id.toString()}`;
    return Buffer.from(raw).toString("base64url");
}

// Returns a Mongo filter for "older than the cursor", null for no cursor, or throws on garbage.
export function cursorFilter(cursor) {
    if (!cursor) return null;
    const [iso, id] = Buffer.from(String(cursor), "base64url").toString("utf8").split("|");
    const createdAt = new Date(iso);
    if (!id || Number.isNaN(createdAt.getTime()) || !mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error("Invalid cursor");
        err.status = 400;
        throw err;
    }
    const _id = new mongoose.Types.ObjectId(id);
    return { $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: _id } }] };
}

export function parseLimit(value, fallback, max) {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, 1), max);
}

// Fetch limit + 1 rows, then call this to split off the extra row into a next cursor.
export function pageOf(rows, limit) {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null };
}
