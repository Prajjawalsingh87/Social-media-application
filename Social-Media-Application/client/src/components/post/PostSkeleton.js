import React from "react";
import "./Post.scss";

// Placeholder card shown while feed posts load.
function PostSkeleton() {
    return (
        <div className="Post card post-skeleton" aria-hidden="true">
            <div className="post-header sk-header">
                <span className="sk sk-avatar" />
                <span className="sk-lines">
                    <span className="sk sk-line" />
                    <span className="sk sk-line short" />
                </span>
            </div>
            <div className="sk sk-media" />
            <div className="post-body">
                <span className="sk sk-line" />
            </div>
        </div>
    );
}

export default PostSkeleton;
