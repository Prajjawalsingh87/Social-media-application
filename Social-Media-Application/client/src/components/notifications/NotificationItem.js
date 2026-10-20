import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Avatar from "../avatar/Avatar";
import { markNotificationRead } from "../../redux/slices/notificationsSlice";

const VERBS = {
    like: "liked your post",
    follow: "started following you",
    comment: "commented on your post",
};

function NotificationItem({ notification, onNavigate }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const myId = useSelector((state) => state.appConfigReducer.myProfile?._id);
    const { actor, post, type, read, timeAgo } = notification;

    function handleClick() {
        if (!read) dispatch(markNotificationRead(notification._id));
        // Posts have no page of their own yet, so likes open your profile where the post is.
        navigate(type === "follow" || !myId ? `/profile/${actor._id}` : `/profile/${myId}`);
        onNavigate?.();
    }

    return (
        <li>
            <button type="button" className={`NotificationItem ${read ? "" : "unread"}`} onClick={handleClick}>
                <Avatar src={actor.avatar?.url} size="sm" />
                <span className="n-text">
                    <span>
                        <strong>{actor.name}</strong> {VERBS[type] || "interacted with you"}
                    </span>
                    <span className="n-time">{timeAgo}</span>
                </span>
                {post?.image?.url && <img className="n-thumb" src={post.image.url} alt="" loading="lazy" />}
                {!read && <span className="n-dot" aria-label="Unread" />}
            </button>
        </li>
    );
}

export default NotificationItem;
