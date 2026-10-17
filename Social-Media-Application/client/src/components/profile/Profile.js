import React, { useEffect, useState } from "react";
import Post from "../post/Post";
import Avatar from "../avatar/Avatar";
import "./Profile.scss";
import { useNavigate, useParams } from "react-router";
import CreatePost from "../createPost/CreatePost";
import { useDispatch, useSelector } from "react-redux";
import { getUserProfile } from "../../redux/slices/postsSlice";
import { followAndUnfollowUser } from "../../redux/slices/feedSlice";
import { BsCamera, BsCalendar3, BsPeople } from "react-icons/bs";
import { FiEdit2 } from "react-icons/fi";

function joinedLabel(createdAt) {
    if (!createdAt) return null;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return `Joined ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

function Profile() {
    const navigate = useNavigate();
    const params = useParams();
    const userProfile = useSelector((state) => state.postsReducer.userProfile);
    const myProfile = useSelector((state) => state.appConfigReducer.myProfile);
    const feedData = useSelector((state) => state.feedDataReducer.feedData);
    const dispatch = useDispatch();
    const [isMyProfile, setIsMyProfile] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        dispatch(
            getUserProfile({
                userId: params.userId,
            })
        );
        setIsMyProfile(myProfile?._id === params.userId);
        setIsFollowing(
            Boolean(feedData?.followings?.find((item) => item._id === params.userId))
        );
    }, [myProfile, params.userId, feedData, dispatch]);

    function handleUserFollow() {
        dispatch(followAndUnfollowUser({
            userIdToFollow: params.userId
        }))
    }

    const posts = userProfile?.posts || [];
    const stats = [
        { label: posts.length === 1 ? "Post" : "Posts", value: posts.length },
        { label: "Followers", value: userProfile?.followers?.length || 0 },
        { label: "Following", value: userProfile?.followings?.length || 0 },
    ];

    return (
        <div className="Profile">
            <div className="container">
                <section className="profile-header card">
                    <div className="cover" aria-hidden="true" />
                    <div className="header-body">
                        <div className="avatar-wrap">
                            <Avatar src={userProfile?.avatar?.url} size="xl" alt={userProfile?.name} />
                        </div>

                        <div className="identity">
                            <div className="name-row">
                                <h1 className="user-name">{userProfile?.name}</h1>
                                {isMyProfile ? (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => navigate("/updateProfile")}
                                    >
                                        <FiEdit2 /> Edit profile
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleUserFollow}
                                        className={isFollowing ? "btn-secondary" : "btn-primary"}
                                    >
                                        {isFollowing ? "Following" : "Follow"}
                                    </button>
                                )}
                            </div>

                            <ul className="stats">
                                {stats.map((stat) => (
                                    <li key={stat.label}>
                                        <span className="stat-value">{stat.value.toLocaleString()}</span>
                                        <span className="stat-label">{stat.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="profile-body">
                    <aside className="profile-aside">
                        <section className="card about-card">
                            <h2 className="card-title">About</h2>
                            {userProfile?.bio ? (
                                <p className="bio">{userProfile.bio}</p>
                            ) : (
                                <p className="bio muted">
                                    {isMyProfile ? "Add a short bio so people know who you are." : "No bio yet."}
                                </p>
                            )}
                            <ul className="facts">
                                <li>
                                    <BsPeople className="fact-icon" />
                                    Followed by {(userProfile?.followers?.length || 0).toLocaleString()}{" "}
                                    {userProfile?.followers?.length === 1 ? "person" : "people"}
                                </li>
                                {joinedLabel(userProfile?.createdAt) && (
                                    <li>
                                        <BsCalendar3 className="fact-icon" />
                                        {joinedLabel(userProfile?.createdAt)}
                                    </li>
                                )}
                            </ul>
                            {isMyProfile && !userProfile?.bio && (
                                <button
                                    type="button"
                                    className="btn-secondary btn-sm btn-block"
                                    onClick={() => navigate("/updateProfile")}
                                >
                                    Add bio
                                </button>
                            )}
                        </section>
                    </aside>

                    <section className="profile-posts">
                        {isMyProfile && <CreatePost />}

                        <h2 className="posts-title">Posts</h2>
                        {posts.length > 0 ? (
                            posts.map((post) => <Post key={post._id} post={post} />)
                        ) : (
                            <div className="card empty-state">
                                <BsCamera className="empty-icon" />
                                <h3>No posts yet</h3>
                                <p>
                                    {isMyProfile
                                        ? "Share your first photo using the box above."
                                        : "When they share photos, they'll appear here."}
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Profile;
