import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { BsPeople, BsImages, BsExclamationCircle } from "react-icons/bs";
import Avatar from "../../components/avatar/Avatar";
import Post from "../../components/post/Post";
import Trending from "../../components/trending/Trending";
import { runSearch } from "../../redux/slices/searchSlice";
import { followAndUnfollowUser } from "../../redux/slices/feedSlice";
import { getHighlightTerms, highlight } from "../../utils/searchText";
import "./Search.scss";

const TABS = [
    { id: "all", label: "All" },
    { id: "people", label: "People", type: "users" },
    { id: "posts", label: "Posts", type: "posts" },
];
const PAGE_SIZE = 10;
const PREVIEW_SIZE = 5;

function UserResult({ user, terms }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const followers = user.followersCount || 0;

    return (
        <li className="user-result">
            <button type="button" className="user-main" onClick={() => navigate(`/profile/${user._id}`)}>
                <Avatar src={user.avatar?.url} />
                <span className="user-text">
                    <span className="user-name">
                        <span className="name-text">{highlight(user.name, terms)}</span>
                        {user.isMe && <span className="you-badge">You</span>}
                    </span>
                    {user.bio && <span className="user-bio">{highlight(user.bio, terms)}</span>}
                    <span className="user-meta">{`${followers.toLocaleString()} ${followers === 1 ? "follower" : "followers"}`}</span>
                </span>
            </button>
            {!user.isMe && (
                <button
                    type="button"
                    className={`btn-sm ${user.isFollowing ? "btn-secondary" : "btn-primary"}`}
                    onClick={() => dispatch(followAndUnfollowUser({ userIdToFollow: user._id }))}
                >
                    {user.isFollowing ? "Following" : "Follow"}
                </button>
            )}
        </li>
    );
}

function SkeletonList() {
    return (
        <div className="card result-card" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-row">
                    <span className="sk sk-avatar" />
                    <span className="sk-lines">
                        <span className="sk sk-line" />
                        <span className="sk sk-line short" />
                    </span>
                </div>
            ))}
        </div>
    );
}

function Search() {
    const dispatch = useDispatch();
    const [params, setParams] = useSearchParams();
    const q = (params.get("q") || "").trim();
    const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "all";
    const { status, error, users, posts, loadingMore, query } = useSelector((state) => state.searchReducer);
    const terms = useMemo(() => getHighlightTerms(q), [q]);
    const isHashtag = /^#[A-Za-z0-9_]+$/.test(q);
    const pageInputRef = useRef(null);

    // Fetch both result types once per query so the tab counts are always right.
    const firstPageSize = tab === "all" ? PREVIEW_SIZE : PAGE_SIZE;
    useEffect(() => {
        if (!q) return undefined;
        const request = dispatch(runSearch({ q, type: "all", limit: firstPageSize }));
        return () => request.abort();
    }, [dispatch, q, firstPageSize]);

    // On small screens the navbar box is hidden, so focus this one when arriving empty.
    useEffect(() => {
        if (!q && pageInputRef.current?.offsetParent !== null) pageInputRef.current?.focus();
    }, [q]);

    function setTab(id) {
        const next = new URLSearchParams(params);
        if (id === "all") next.delete("tab");
        else next.set("tab", id);
        setParams(next, { replace: true });
    }

    function handlePageSearch(e) {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q")?.toString().trim();
        if (value) setParams({ q: value }, { replace: Boolean(q) });
    }

    function retry() {
        dispatch(runSearch({ q, type: "all", limit: firstPageSize }));
    }

    function loadMore(type) {
        const list = type === "users" ? users : posts;
        dispatch(runSearch({ q, type, page: list.page + 1, limit: PAGE_SIZE }));
    }

    const isLoading = status === "loading" || (q && query !== q);
    const showPeople = !isHashtag && (tab === "all" || tab === "people");
    const showPosts = tab === "all" || tab === "posts";
    const noResults = status === "succeeded" && !isLoading && users.total === 0 && posts.total === 0;

    const counts = { people: users.total, posts: posts.total };

    return (
        <div className="Search">
            <div className="container">
                <main className="search-main">
                    <form className="page-search card" onSubmit={handlePageSearch} role="search">
                        <AiOutlineSearch className="search-icon" aria-hidden="true" />
                        <input
                            key={q}
                            ref={pageInputRef}
                            name="q"
                            type="search"
                            defaultValue={q}
                            maxLength={100}
                            placeholder="Search people, posts, #tags"
                            aria-label="Search Orbit"
                        />
                        <button type="submit" className="btn-primary btn-sm">Search</button>
                    </form>

                    {!q ? (
                        <div className="card empty-state">
                            <AiOutlineSearch className="empty-icon" />
                            <h3>Search Orbit</h3>
                            <p>Find people by name or bio, posts by caption, or browse a #hashtag. Press Ctrl K from anywhere.</p>
                        </div>
                    ) : (
                        <>
                            <header className="results-header">
                                <h2 className="results-title">
                                    {isHashtag ? "Posts tagged " : "Results for "}
                                    <span className="query">{isHashtag ? q : `“${q}”`}</span>
                                </h2>
                                <div className="tabs" role="tablist" aria-label="Result type">
                                    {TABS.filter((t) => !(isHashtag && t.id === "people")).map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={tab === t.id}
                                            className={`tab ${tab === t.id ? "active" : ""}`}
                                            onClick={() => setTab(t.id)}
                                        >
                                            {t.label}
                                            {t.id !== "all" && status === "succeeded" && !isLoading && (
                                                <span className="tab-count">{counts[t.id]}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </header>

                            {isLoading && <SkeletonList />}

                            {!isLoading && status === "failed" && (
                                <div className="card empty-state error-state" role="alert">
                                    <BsExclamationCircle className="empty-icon" />
                                    <h3>Search didn’t work</h3>
                                    <p>{/network error/i.test(error || "") ? "Couldn’t reach Orbit. Check your connection and try again." : error}</p>
                                    <button type="button" className="btn-secondary btn-sm" onClick={retry}>Try again</button>
                                </div>
                            )}

                            {noResults && (
                                <div className="card empty-state">
                                    <AiOutlineSearch className="empty-icon" />
                                    <h3>No results for “{q}”</h3>
                                    <p>Check the spelling, try fewer words, or search a #hashtag.</p>
                                </div>
                            )}

                            {!isLoading && status === "succeeded" && !noResults && (
                                <>
                                    {showPeople && (tab === "people" || users.total > 0) && (
                                        <section className="result-section" aria-label="People">
                                            {tab === "all" && (
                                                <div className="section-head">
                                                    <h3><BsPeople /> People</h3>
                                                    {users.total > users.items.length && (
                                                        <button type="button" className="see-all" onClick={() => setTab("people")}>
                                                            See all {users.total}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {users.items.length > 0 ? (
                                                <ul className="card result-card">
                                                    {users.items.map((user) => (
                                                        <UserResult key={user._id} user={user} terms={terms} />
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="card empty-state"><p>No people match “{q}”.</p></div>
                                            )}
                                            {tab === "people" && users.hasMore && (
                                                <button type="button" className="btn-secondary load-more" disabled={loadingMore} onClick={() => loadMore("users")}>
                                                    {loadingMore ? "Loading…" : "Show more people"}
                                                </button>
                                            )}
                                        </section>
                                    )}

                                    {showPosts && (tab === "posts" || posts.total > 0) && (
                                        <section className="result-section" aria-label="Posts">
                                            {tab === "all" && (
                                                <div className="section-head">
                                                    <h3><BsImages /> Posts</h3>
                                                    {posts.total > posts.items.length && (
                                                        <button type="button" className="see-all" onClick={() => setTab("posts")}>
                                                            See all {posts.total}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {posts.items.length > 0 ? (
                                                <div className="post-results">
                                                    {posts.items.map((post) => (
                                                        <Post key={post._id} post={post} highlightTerms={terms} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="card empty-state"><p>No posts match “{q}”.</p></div>
                                            )}
                                            {tab === "posts" && posts.hasMore && (
                                                <button type="button" className="btn-secondary load-more" disabled={loadingMore} onClick={() => loadMore("posts")}>
                                                    {loadingMore ? "Loading…" : "Show more posts"}
                                                </button>
                                            )}
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </main>

                <aside className="search-side">
                    <Trending />
                </aside>
            </div>
        </div>
    );
}

export default Search;
