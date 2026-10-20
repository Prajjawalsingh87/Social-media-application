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
