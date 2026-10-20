import mongoose from "mongoose";

export const NOTIFICATION_TYPES = ["like", "follow", "comment"];
// Old notifications expire on their own (TTL index below), so the collection stays small.
export const NOTIFICATION_TTL_DAYS = 90;

const notificationSchema = mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", default: null },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// Newest-first listing per user (also serves the unread count).
notificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 }, { name: "recipient_created" });
// One notification per (recipient, actor, type, post): repeat like/unlike/like does not spam.
notificationSchema.index({ recipient: 1, actor: 1, type: 1, post: 1 }, { name: "dedupe", unique: true });
notificationSchema.index(
    { createdAt: 1 },
    { name: "ttl", expireAfterSeconds: NOTIFICATION_TTL_DAYS * 24 * 60 * 60 }
);

export default mongoose.model("notification", notificationSchema);
