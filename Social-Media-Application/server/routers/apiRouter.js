import express from "express";
import requireUser from "../middlewares/requireUser.js";
import searchController from "../controllers/searchController.js";
import notificationsController from "../controllers/notificationsController.js";
import { getFeedNextPage } from "../controllers/userController.js";
const router = express.Router();

// The /api routes answer with real HTTP status codes (401, 400, 500...) as well as the
// usual { status, statusCode, message } body, so clients and monitors can rely on either.
router.use((req, res, next) => {
    const send = res.send.bind(res);
    res.send = (body) => {
        if (body && typeof body === "object" && body.status === "error" && Number.isInteger(body.statusCode)) {
            res.status(body.statusCode);
        }
        return send(body);
    };
    next();
});

router.get("/search", requireUser, searchController.searchController);
router.get("/trending", requireUser, searchController.trendingController);
router.get("/feed", requireUser, getFeedNextPage);

router.get("/notifications", requireUser, notificationsController.listNotifications);
router.get("/notifications/unread-count", requireUser, notificationsController.unreadCount);
router.post("/notifications/read-all", requireUser, notificationsController.markAllRead);
router.post("/notifications/:id/read", requireUser, notificationsController.markRead);

router.use((req, res) => {
    res.status(404).json({ status: "error", statusCode: 404, message: "Not found" });
});

export default router;
