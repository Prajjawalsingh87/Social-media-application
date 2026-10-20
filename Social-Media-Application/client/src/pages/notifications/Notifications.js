import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineBell } from "react-icons/ai";
import { BsExclamationCircle } from "react-icons/bs";
import NotificationItem from "../../components/notifications/NotificationItem";
import {
    fetchNotifications,
    markAllNotificationsRead,
} from "../../redux/slices/notificationsSlice";
import "../../components/notifications/Notifications.scss";

function Notifications() {
    const dispatch = useDispatch();
    const unreadCount = useSelector((state) => state.notificationsReducer.unreadCount);
    const { items, nextCursor, status, loadingMore, error } = useSelector(
        (state) => state.notificationsReducer.page
    );

    useEffect(() => {
        dispatch(fetchNotifications({ target: "page", limit: 20 }));
    }, [dispatch]);

    return (
        <div className="NotificationsPage">
            <div className="container">
                <header className="page-head">
                    <h1>Notifications</h1>
                    {unreadCount > 0 && (
                        <button type="button" className="btn-secondary btn-sm" onClick={() => dispatch(markAllNotificationsRead())}>
                            Mark all as read
                        </button>
                    )}
                </header>

                {status === "loading" && <div className="card empty-state"><p>Loading notifications…</p></div>}

                {status === "failed" && (
                    <div className="card empty-state" role="alert">
                        <BsExclamationCircle className="empty-icon" />
                        <h3>Couldn’t load notifications</h3>
                        <p>{error}</p>
                        <button type="button" className="btn-secondary btn-sm retry" onClick={() => dispatch(fetchNotifications({ target: "page", limit: 20 }))}>
                            Try again
                        </button>
                    </div>
                )}

                {status === "succeeded" && items.length === 0 && (
                    <div className="card empty-state">
                        <AiOutlineBell className="empty-icon" />
                        <h3>No notifications yet</h3>
                        <p>When someone likes your posts or follows you, you’ll see it here.</p>
                    </div>
                )}

                {items.length > 0 && (
                    <ul className="card notif-list">
                        {items.map((n) => (
                            <NotificationItem key={n._id} notification={n} />
                        ))}
                    </ul>
                )}

                {nextCursor && (
                    <button
                        type="button"
                        className="btn-secondary load-more"
                        disabled={loadingMore}
                        onClick={() => dispatch(fetchNotifications({ target: "page", cursor: nextCursor, limit: 20 }))}
                    >
                        {loadingMore ? "Loading…" : "Show older"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default Notifications;
