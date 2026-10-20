import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { success, error } from "../utils/responseWrapper.js";
import { timeAgo } from "../utils/Utils.js";
import { cursorFilter, pageOf, parseLimit } from "../utils/cursor.js";

const MAX_LIMIT = 30;

function mapNotification(n) {
    return {
        _id: n._id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        timeAgo: timeAgo(n.createdAt),
        actor: { _id: n.actor._id, name: n.actor.name, avatar: n.actor.avatar },
        post: n.post
            ? { _id: n.post._id, image: n.post.image, caption: (n.post.caption || "").slice(0, 80) }
            : null,
    };
}

// GET /api/notifications?cursor=&limit=
export const listNotifications = async (req, res) => {
    try {
        const limit = parseLimit(req.query.limit, 15, MAX_LIMIT);
        const filter = { recipient: req._id };
        const older = cursorFilter(req.query.cursor);
        if (older) Object.assign(filter, older);

        const rows = await Notification.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1)
            .populate("actor", "name avatar")
            .populate("post", "image caption")
            .lean();

        const { items, nextCursor } = pageOf(rows, limit);
        // Skip entries whose actor no longer exists, or whose post was deleted.
        const visible = items.filter((n) => n.actor && (n.type === "follow" || n.post));
        const unreadCount = await Notification.countDocuments({ recipient: req._id, read: false });
        return res.send(success(200, { items: visible.map(mapNotification), nextCursor, unreadCount }));
    } catch (e) {
        if (e.status === 400) return res.send(error(400, e.message));
        console.log("notifications error", e);
        return res.send(error(500, "Could not load notifications"));
    }
};

// GET /api/notifications/unread-count
export const unreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ recipient: req._id, read: false });
        return res.send(success(200, { unreadCount: count }));
    } catch (e) {
        return res.send(error(500, "Could not load notifications"));
    }
};

// POST /api/notifications/:id/read
export const markRead = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.send(error(400, "Invalid notification id"));
        }
        const result = await Notification.updateOne(
            { _id: req.params.id, recipient: req._id },
            { $set: { read: true } }
        );
        if (result.matchedCount === 0) {
            return res.send(error(404, "Notification not found"));
        }
        const count = await Notification.countDocuments({ recipient: req._id, read: false });
        return res.send(success(200, { unreadCount: count }));
    } catch (e) {
        return res.send(error(500, "Could not update notification"));
    }
};

// POST /api/notifications/read-all
export const markAllRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req._id, read: false },
            { $set: { read: true } }
        );
        return res.send(success(200, { updated: result.modifiedCount, unreadCount: 0 }));
    } catch (e) {
        return res.send(error(500, "Could not update notifications"));
    }
};

export default { listNotifications, unreadCount, markRead, markAllRead };
