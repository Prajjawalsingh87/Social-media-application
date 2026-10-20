import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { getTrending } from "../../redux/slices/searchSlice";
import { hashtagSearchPath } from "../../utils/searchText";
import "./Trending.scss";

// "Trending this week": most-used hashtags and the most liked posts of the last 7 days.
function Trending() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const trending = useSelector((state) => state.searchReducer.trending);

    useEffect(() => {
        dispatch(getTrending());
    }, [dispatch]);

    const hashtags = trending?.hashtags || [];
    // Hide posts that were unliked since the list loaded.
    const posts = (trending?.posts || []).filter((post) => post.likesCount > 0);

    return (
        <section className="Trending card side-section" aria-label="Trending this week">
            <h3 className="section-title">Trending this week</h3>

            {!trending && <p className="section-empty">Loading…</p>}

            {trending && hashtags.length > 0 && (
                <div className="tags">
                    {hashtags.slice(0, 8).map(({ tag, count }) => (
                        <Link key={tag} className="tag-chip" to={hashtagSearchPath(tag)} title={`${count} ${count === 1 ? "post" : "posts"}`}>
                            #{tag}
                            <span className="tag-count">{count}</span>
                        </Link>
                    ))}
                </div>
            )}

            {trending && posts.length > 0 && (
                <ul className="trend-posts">
                    {posts.map((post) => (
                        <li key={post._id}>
                            <button type="button" className="trend-post" onClick={() => navigate(`/profile/${post.owner?._id}`)}>
                                {post.image?.url && <img src={post.image.url} alt="" loading="lazy" />}
                                <span className="trend-text">
                                    <span className="trend-caption">{post.caption}</span>
                                    <span className="trend-meta">
                                        {post.owner?.name} · <AiFillHeart className="heart" aria-hidden="true" /> {post.likesCount}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {trending && !posts.length && !hashtags.length && (
                <p className="section-empty">
                    {trending.failed ? "Trending is unavailable right now." : "Nothing trending yet. Like posts and add #tags to get things moving."}
                </p>
            )}
        </section>
    );
}

export default Trending;
