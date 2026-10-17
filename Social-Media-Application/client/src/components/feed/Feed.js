import React, { useEffect } from 'react'
import Follower from '../follower/Follower'
import Post from '../post/Post'
import Avatar from '../avatar/Avatar'
import './Feed.scss'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { getFeedData } from '../../redux/slices/feedSlice';
import { BsImages } from 'react-icons/bs';

function Feed() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const feedData = useSelector(state => state.feedDataReducer.feedData)
  const myProfile = useSelector(state => state.appConfigReducer.myProfile);

  useEffect(() => {
    dispatch(getFeedData());
  }, [dispatch])

  const posts = feedData?.posts || [];
  const followings = feedData?.followings || [];
  const suggestions = feedData?.suggestions || [];

  return (
    <div className="Feed">
      <div className="container">
        <main className="feed-main">
          {posts.length > 0 ? (
            posts.map(post => <Post key={post._id} post={post} />)
          ) : (
            <div className="card empty-state">
              <BsImages className="empty-icon" />
              <h3>Your feed is empty</h3>
              <p>Follow people from the suggestions to see their posts here.</p>
            </div>
          )}
        </main>

        <aside className="feed-sidebar">
          {myProfile?._id && (
            <button
              type="button"
              className="card me-card"
              onClick={() => navigate(`/profile/${myProfile._id}`)}
            >
              <Avatar src={myProfile?.avatar?.url} size="lg" />
              <span className="me-info">
                <span className="me-name">{myProfile?.name}</span>
                <span className="me-link">View your profile</span>
              </span>
            </button>
          )}

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
