import React from "react";
import Avatar from "../avatar/Avatar";
import "./Post.scss";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useDispatch } from 'react-redux';
import { likeAndUnlikePost } from "../../redux/slices/postsSlice";
import { useNavigate } from "react-router";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { renderCaption } from "../../utils/searchText";

// highlightTerms: optional search terms to <mark> in the caption (search results).
function Post({ post, highlightTerms = [] }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    async function handlePostLiked() {
        dispatch(likeAndUnlikePost({
            postId: post._id
        }))
    }

    const likes = post.likesCount || 0;
    const openOwnerProfile = () => navigate(`/profile/${post.owner?._id}`);

    return (
        <article className="Post card">
            <header className="post-header">
                <button type="button" className="owner" onClick={openOwnerProfile}>
                    <Avatar src={post.owner?.avatar?.url} />
                    <span className="owner-info">
                        <span className="owner-name">{post.owner?.name}</span>
                        {post?.timeAgo && <span className="time-ago">{post.timeAgo}</span>}
                    </span>
                </button>
            </header>

            {post?.image?.url && (
                <div className="post-media" onDoubleClick={() => !post.isLiked && handlePostLiked()}>
                    <img src={post.image.url} alt={post.caption || "Post"} loading="lazy" />
                </div>
            )}

            <div className="post-body">
                <div className="post-actions">
                    <button
                        type="button"
                        className={`action ${post.isLiked ? "liked" : ""}`}
                        onClick={handlePostLiked}
                        aria-label={post.isLiked ? "Unlike" : "Like"}
                        aria-pressed={Boolean(post.isLiked)}
                    >
                        {post.isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
                    </button>
                    <button type="button" className="action" aria-label="Comment" title="Comments (coming soon)">
                        <FiMessageCircle />
                    </button>
                    <button type="button" className="action" aria-label="Share" title="Share (coming soon)">
                        <FiSend />
                    </button>
                </div>

                <p className="likes">{`${likes.toLocaleString()} ${likes === 1 ? "like" : "likes"}`}</p>

                {post.caption && (
                    <p className="caption">
                        <button type="button" className="caption-owner" onClick={openOwnerProfile}>
                            {post.owner?.name}
                        </button>
                        {renderCaption(post.caption, highlightTerms)}
                    </p>
                )}
            </div>
        </article>
    );
}

export default Post;
