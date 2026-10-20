import ta from 'time-ago';

// "just now" instead of time-ago's "834 ms ago" / "5 seconds ago".
export const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    return diff < 60 * 1000 ? 'just now' : ta.ago(date);
};

export const mapPostOutput = (post, userId) => {
    return {
        _id: post._id,
        caption: post.caption,
        image: post.image,
        owner: {
            _id: post.owner._id,
            name: post.owner.name,
            avatar: post.owner.avatar
        },
        likesCount: post.likes.length,
        isLiked: post.likes.includes(userId),
        timeAgo: timeAgo(post.createdAt)
    }
};




