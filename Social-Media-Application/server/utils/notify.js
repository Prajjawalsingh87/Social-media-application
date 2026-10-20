import Notification from "../models/Notification.js";

// Records "actor did <type> to recipient". Never throws: a failed notification must not
// break the like/follow that triggered it. Self-actions are ignored and repeats are
// de-duplicated by the unique (recipient, actor, type, post) index.
export async function notify({ recipient, actor, type, post = null }) {
    try {
        if (!recipient || !actor || recipient.toString() === actor.toString()) {
            return;
        }
        await Notification.updateOne(
            { recipient, actor, type, post },
            { $setOnInsert: { recipient, actor, type, post, read: false, createdAt: new Date() } },
            { upsert: true }
        );
    } catch (e) {
        if (e.code !== 11000) {
            // 11000 = two identical upserts raced; one notification exists, which is what we want.
            console.log("notify failed", e.message);
        }
    }
}
