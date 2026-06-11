import React from "react";
import Avatar from "../avatar/Avatar";
import "./Post.scss";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useDispatch } from 'react-redux';
import { likeAndUnlikePost } from "../../redux/slices/postsSlice";
import { useNavigate } from "react-router";
import { FiMessageCircle } from "react-icons/fi";
import { HiOutlineShare } from "react-icons/hi";

function Post({ post }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    async function handlePostLiked() {
        dispatch(likeAndUnlikePost({
            postId: post._id
        }))
    }

    return (
        <div className="Post">
            <div className="heading" onClick={() => navigate(`/profile/${post.owner._id}`)}>
                <Avatar src={post.owner?.avatar?.url} />
                <h4>{post.owner?.name}</h4>
            </div>
            <div className="content">
                <img src={post?.image?.url} alt="" />
            </div>
            <div className="footer">
                <div className="like" onClick={handlePostLiked}>
                    {post.isLiked ? <AiFillHeart className="icon liked" /> : <AiOutlineHeart className="icon" />}
                    <h4>{`${post.likesCount} likes`}</h4>
                </div>
                <div className="actions">
                    <FiMessageCircle className="comment-icon" />
                    <HiOutlineShare className="share-icon" />
                </div>
                <p className="caption">{post.caption}</p>
                <h6 className="time-ago">{post?.timeAgo}</h6>
            </div>
        </div>
    );
}

export default Post;
