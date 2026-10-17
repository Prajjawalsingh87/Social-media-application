import React, { useEffect, useState } from "react";
import Avatar from "../avatar/Avatar";
import "./Follower.scss";
import { useSelector, useDispatch } from "react-redux";
import { followAndUnfollowUser } from "../../redux/slices/feedSlice";
import { useNavigate } from "react-router";

function Follower({ user }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const feedData = useSelector((state) => state.feedDataReducer.feedData);
    const [isFollowing, setIsFollowing] = useState();

    useEffect(() => {
        setIsFollowing(
            Boolean(feedData?.followings?.find((item) => item._id === user._id))
        );
    }, [feedData, user._id]);

    function handleUserFollow() {
        dispatch(followAndUnfollowUser({
            userIdToFollow: user._id
        }))
    }

    return (
        <div className="Follower">
            <button
                type="button"
                className="user-info"
                onClick={() => navigate(`/profile/${user._id}`)}
            >
                <Avatar src={user?.avatar?.url} size="sm" />
                <span className="name">{user?.name}</span>
            </button>

            <button
                type="button"
                onClick={handleUserFollow}
                className={`btn-sm ${isFollowing ? "btn-secondary" : "btn-primary"}`}
            >
                {isFollowing ? "Following" : "Follow"}
            </button>
        </div>
    );
}

export default Follower;
