# Orbit — Social media application

React and Redux frontend with an Express/MongoDB backend. Create an account using
email OTP, publish image posts, follow people and browse a personalized feed.

- Frontend: https://social-media-application-7gjn.vercel.app
- API: https://social-media-application-eta.vercel.app

## Features

Posts, likes, follows, profile editing, account signup/login and OTP verification.
The responsive UI supports light and dark themes with consistent indigo accents.
The post composer accepts JPEG, PNG, WebP and GIF images up to 5 MB, reports
file-read failures, and shows a 2,200-character caption limit. These frontend
checks improve feedback; backend validation remains the server's responsibility.

### Search, hashtags and trending

- **Global search** (navbar, or press `Ctrl K` / `⌘ K` / `/` anywhere): results update
  as you type (300 ms debounce) on a results page with **All / People / Posts** tabs,
  highlighted matches, load-more pagination and loading, empty and error states.
- **Hashtags**: `#tags` in captions are links; searching `#tag` lists the posts that
  use it.
- **Trending this week**: the feed and search page show the most-used hashtags and
  the most-liked posts of the last 7 days.

Search runs on MongoDB itself, with no extra search service. At startup the server
creates the text indexes (idempotent `createIndex`): `user_search_text` on
`name` (weight 10) and `bio` (weight 2), and `post_search_text` on `caption`.
People results combine the `$text` score with name prefix matching
(exact name > name starts with > any word starts with), so half-typed names match.
Post results combine the stemmed `$text` score (e.g. "hiking" finds "hike") with a
phrase/prefix match and a small likes boost. Users have no separate username field;
`name` serves as the handle.

| Endpoint (auth required) | Description |
|---|---|
| `GET /api/search?q=&type=all\|users\|posts&page=&limit=` | `q` up to 100 characters (first 8 words used); `limit` 1–20 (default 5 for `all`, 10 otherwise); `page` up to 50. Returns `{ users, posts }`, each `{ items, total, page, limit, hasMore }`. |
| `GET /api/trending?days=7&limit=5` | `{ posts, hashtags }` for the last `days` (1–30). |

### Notifications, feed and uploads

- **Notifications**: likes and new followers create a notification. They are stored in the
  `notifications` collection (recipient, actor, type, post, read, createdAt). Indexes:
  `recipient + createdAt` for listing, a unique `(recipient, actor, type, post)` index so
  like → unlike → like does not notify twice, and a 90-day TTL index. Your own actions
  never notify you. The navbar bell shows an unread badge and a dropdown, and
  `/notifications` lists everything. The `comment` type is reserved: Orbit has no
  comments yet.
- **Polling, not push**: Vercel serverless functions can't hold WebSocket connections, so
  the bell polls the unread count every 30 s. It pauses while the tab is hidden and
  refreshes when the tab regains focus. Real-time push would need a hosted channel
  service such as Pusher or Ably.
- **Infinite-scroll feed**: the feed loads 10 posts at a time using a cursor
  (`createdAt` + `_id`, so new posts never cause duplicates or gaps). An
  IntersectionObserver loads the next page, with a skeleton while loading and
  "You're all caught up" at the end. `GET /user/getFeedData` without `limit` still
  returns every post, as before.
- **Image compression**: before upload the browser resizes photos to at most 1600 px
  on the long edge (800 px for avatars) and re-encodes them as WebP at quality 0.85
  (JPEG where WebP encoding is unsupported). It applies EXIF orientation via
  `createImageBitmap(..., { imageOrientation: "from-image" })` and shows original
  vs compressed size. The 5 MB limit applies to the compressed file; sources over
  30 MB are refused. GIFs are uploaded unchanged to keep animation.
  Vercel also limits request bodies to about 4.5 MB, so compression matters for
  phone photos.
- **Deleting an account** (`DELETE /user`) removes only that user's data: their posts and
  post images, their likes on other posts, follow links to them, and notifications
  they sent or received.

| Endpoint (auth required) | Description |
|---|---|
| `GET /api/feed?cursor=&limit=` | Next feed page: `{ posts, nextCursor }`. `limit` 1–30. |
| `GET /api/notifications?cursor=&limit=` | `{ items, nextCursor, unreadCount }`, newest first. |
| `GET /api/notifications/unread-count` | `{ unreadCount }` |
| `POST /api/notifications/:id/read` | Mark one read (only your own). |
| `POST /api/notifications/read-all` | Mark all read. |

Unlike the older routes, `/api/*` also sets the real HTTP status (400, 401, 404, 500)
alongside the usual `{ status, statusCode, message }` body; the client refreshes the
access token on a 401 from either style.

## Local setup

```bash
npm run install-all
cp Social-Media-Application/server/.env.example Social-Media-Application/server/.env
cp Social-Media-Application/client/.env.example Social-Media-Application/client/.env
# Fill in the values below, then:
npm run dev
```

The client runs on port 3000; the API defaults to port 4001.
Set `REACT_APP_API_URL=http://localhost:4001` in the client environment.

The server uses these exact environment names (see its `.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `ACCESS_TOKEN_PRIVATE_KEY` | Access-token signing secret |
| `REFRESH_TOKEN_PRIVATE_KEY` | Refresh-token signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Image service API key |
| `CLOUDINARY_API_SECRET` | Image service secret |
| `EMAIL_SERVICE` | Nodemailer service, e.g. gmail |
| `EMAIL_USER` | OTP sender account |
| `EMAIL_PASSWORD` | Mail app password |
| `PORT` | Local server port, default 4001 |

`FRONTEND_URL` is present in the example file but the current server reflects
request origins; it is not an enforced allowlist.
Never commit filled environment files.

## Verify

```bash
cd Social-Media-Application/client
npm ci
npm run build
```

`GET /health` on the API returns 200 when MongoDB is connected and 503 otherwise.
`GET /api/search?q=x` without a token returns HTTP 401.

`npm run check:deletion` in `Social-Media-Application/server` (optionally followed by
`-- <api-url>`) runs an end-to-end check against a running API. It signs up three
throwaway `orbit_test_bot_*` accounts, creates likes, follows and notifications, deletes
one account, and asserts that only that account's data is gone. It then deletes the
other two accounts.

**MongoDB on serverless**: the connection promise is cached on `globalThis` and every
request awaits it, so cold starts don't race a connect that started at boot. Settings:
`serverSelectionTimeoutMS` 8 s and `maxPoolSize` 5. A failed connect is retried on the
next request and answers 503 instead of exiting the process. `/health` waits up to 9 s
for the connection before reporting.
It exposes connection status only. Full signup, uploads and authenticated flows
require working MongoDB, Cloudinary and email credentials.

## Vercel

There are two existing projects:

| Project | Root directory | Purpose |
|---|---|---|
| `social-media-application-7gjn` | `Social-Media-Application/client` | React frontend |
| `social-media-application` | `Social-Media-Application/server` | Express API |

Link and deploy from the repository root so Vercel can apply the configured root
directory: `vercel link --project social-media-application-7gjn`, then
`vercel deploy` (preview) or `vercel deploy --prod` (production).
Use the server project name for the API. Keep `REACT_APP_API_URL` pointed at the
API production URL in the frontend's Vercel environment.
