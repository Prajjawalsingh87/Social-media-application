import React, { useEffect, useRef } from 'react'
import Follower from '../follower/Follower'
import Post from '../post/Post'
import Avatar from '../avatar/Avatar'
import Trending from '../trending/Trending'
import './Feed.scss'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { getFeedData, loadMoreFeed } from '../../redux/slices/feedSlice';
import PostSkeleton from '../post/PostSkeleton';
import { BsImages, BsCheck2Circle } from 'react-icons/bs';
import { AiOutlineHome, AiOutlineUser, AiOutlineSetting, AiOutlineMessage } from 'react-icons/ai';

function Feed() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const feedData = useSelector(state => state.feedDataReducer.feedData)
  const { loaded, loadingMore, loadMoreError } = useSelector(state => state.feedDataReducer);
  const sentinelRef = useRef(null);
  const myProfile = useSelector(state => state.appConfigReducer.myProfile);

  useEffect(() => {
    dispatch(getFeedData());
  }, [dispatch])

  const posts = feedData?.posts || [];
  const nextCursor = feedData?.nextCursor;

  // Infinite scroll: load the next page when the sentinel below the last post comes near.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || loadMoreError || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        dispatch(loadMoreFeed(nextCursor));
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch, nextCursor, loadMoreError]);
  const followings = feedData?.followings || [];
  const suggestions = feedData?.suggestions || [];

  const menu = [
    { label: 'Home', icon: <AiOutlineHome />, onClick: () => navigate('/'), active: true },
    { label: 'My profile', icon: <AiOutlineUser />, onClick: () => navigate(`/profile/${myProfile?._id}`) },
    { label: 'Edit profile', icon: <AiOutlineSetting />, onClick: () => navigate('/updateProfile') },
    { label: 'Messages', icon: <AiOutlineMessage />, soon: true },
  ];

  return (
    <div className="Feed">
      <div className="container">
        <aside className="feed-left">
          {myProfile?._id && (
            <div className="card me-card">
              <div className="me-cover" aria-hidden="true" />
              <button
                type="button"
                className="me-body"
                onClick={() => navigate(`/profile/${myProfile._id}`)}
              >
                <Avatar src={myProfile?.avatar?.url} size="lg" />
                <span className="me-name">{myProfile?.name}</span>
                {myProfile?.bio && <span className="me-bio">{myProfile.bio}</span>}
              </button>
              <div className="me-stats">
                <div>
                  <span className="value">{myProfile?.followers?.length || 0}</span>
                  <span className="label">Followers</span>
                </div>
                <div>
                  <span className="value">{followings.length}</span>
                  <span className="label">Following</span>
                </div>
              </div>
            </div>
          )}

          <nav className="card side-menu" aria-label="Shortcuts">
            {menu.map(item => (
              <button
                key={item.label}
                type="button"
                className={`menu-item ${item.active ? 'active' : ''}`}
                onClick={item.onClick}
                disabled={item.soon}
                title={item.soon ? 'Coming soon' : undefined}
              >
                <span className="menu-icon">{item.icon}</span>
                {item.label}
                {item.soon && <span className="soon">Soon</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="feed-main">
          {!loaded && posts.length === 0 ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length > 0 ? (
            <>
              {posts.map(post => <Post key={post._id} post={post} />)}
              <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
              {loadingMore && <PostSkeleton />}
              {loadMoreError && (
                <div className="feed-end" role="alert">
                  <p>{loadMoreError}</p>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => dispatch(loadMoreFeed(nextCursor))}>
                    Try again
                  </button>
                </div>
              )}
              {nextCursor && !loadingMore && !loadMoreError && (
                // Fallback for browsers without IntersectionObserver, and for keyboard users.
                <button type="button" className="btn-ghost btn-sm feed-more" onClick={() => dispatch(loadMoreFeed(nextCursor))}>
                  Load more posts
                </button>
              )}
              {!nextCursor && (
                <div className="feed-end">
                  <BsCheck2Circle className="end-icon" aria-hidden="true" />
                  <p>You're all caught up</p>
                  <span>You've seen all posts from people you follow.</span>
                </div>
              )}
            </>
          ) : (
            <div className="card empty-state">
              <BsImages className="empty-icon" />
              <h3>Your feed is empty</h3>
              <p>Follow people from the suggestions to see their posts here.</p>
            </div>
          )}
        </main>

        <aside className="feed-right">
          <Trending />

          <section className="card side-section">
            <h3 className="section-title">
              Following <span className="count">{followings.length}</span>
            </h3>
            {followings.length > 0 ? (
              followings.map(user => <Follower key={user._id} user={user} />)
            ) : (
              <p className="section-empty">You are not following anyone yet.</p>
            )}
          </section>

          <section className="card side-section">
            <h3 className="section-title">Suggested for you</h3>
            {suggestions.length > 0 ? (
              suggestions.map(user => <Follower key={user._id} user={user} />)
            ) : (
              <p className="section-empty">No new suggestions right now.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Feed
