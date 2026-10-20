import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { AiOutlineBell, AiFillBell } from "react-icons/ai";
import NotificationItem from "./NotificationItem";
import {
    fetchNotifications,
    fetchUnreadCount,
    markAllNotificationsRead,
} from "../../redux/slices/notificationsSlice";
import "./Notifications.scss";

// Vercel serverless functions can't hold WebSocket connections, so the bell polls.
// Real-time push would need a hosted channel service such as Pusher or Ably.
export const POLL_INTERVAL_MS = 30000;

function NotificationBell() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const unreadCount = useSelector((state) => state.notificationsReducer.unreadCount);
    const { items, status, error } = useSelector((state) => state.notificationsReducer.preview);
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    // Poll the unread count; pause while the tab is hidden and refresh when it is back.
    useEffect(() => {
        const refresh = () => {
            if (!document.hidden) dispatch(fetchUnreadCount());
        };
        refresh();
        const timer = setInterval(refresh, POLL_INTERVAL_MS);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, [dispatch]);

    useEffect(() => {
        if (open) dispatch(fetchNotifications({ target: "preview", limit: 8 }));
    }, [open, dispatch]);

    // Close on route change, outside click and Escape.
    useEffect(() => setOpen(false), [location.pathname]);
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const badge = unreadCount > 99 ? "99+" : unreadCount;

    return (
        <div className="NotificationBell" ref={rootRef}>
            <button
                type="button"
                className={`icon-btn bell-btn ${open ? "active" : ""}`}
                onClick={() => setOpen((v) => !v)}
                title="Notifications"
                aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
                aria-expanded={open}
                aria-haspopup="true"
            >
                {open ? <AiFillBell /> : <AiOutlineBell />}
                {unreadCount > 0 && <span className="badge">{badge}</span>}
            </button>

            {open && (
                <div className="notif-panel card" role="dialog" aria-label="Notifications">
                    <div className="panel-head">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button type="button" className="link-btn" onClick={() => dispatch(markAllNotificationsRead())}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    {status === "loading" && <p className="panel-msg">Loading…</p>}
                    {status === "failed" && <p className="panel-msg">{error}</p>}
                    {status === "succeeded" && items.length === 0 && (
                        <p className="panel-msg">No notifications yet. Likes and new followers show up here.</p>
                    )}
                    {items.length > 0 && (
                        <ul className="notif-list">
                            {items.slice(0, 8).map((n) => (
                                <NotificationItem key={n._id} notification={n} onNavigate={() => setOpen(false)} />
                            ))}
                        </ul>
                    )}
                    <button type="button" className="panel-foot" onClick={() => navigate("/notifications")}>
                        See all notifications
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
