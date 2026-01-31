# Fix Signup Error - Quick Checklist

## Problem
Network request shows provisional headers and `/api/signup` instead of backend API.

## Root Cause
`REACT_APP_SERVER_BASE_URL` environment variable is not set in Vercel frontend project.

---

## ✅ Step-by-Step Fix

### 1. Get Your Backend URL
- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Click your **backend project**
- Copy the production URL (e.g., `https://your-backend.vercel.app`)

### 2. Set Frontend Environment Variable
- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Click your **frontend project** (social-media-application-7gjn-kx21yap)
- Go to **Settings** tab
- Click **Environment Variables**
- Add new variable:
  ```
  Key: REACT_APP_SERVER_BASE_URL
  Value: https://your-backend.vercel.app
  Environments: Production
  ```
- Click **Save**

### 3. Redeploy Frontend
```bash
cd Social-Media-Application/client
vercel --prod
```

Wait 2-3 minutes for deployment to complete.

### 4. Test
- Go to your frontend URL
- Try signup again
- Check Network tab - request should now go to backend domain, not frontend domain

---

## Verify It's Working

1. Open DevTools (F12)
2. Go to **Console** tab
3. You should see: `API Base URL: https://your-backend.vercel.app`
4. Go to **Network** tab
5. Try signup
6. Check the request URL - it should be `https://your-backend.vercel.app/auth/signup` NOT `/api/signup`

---

## If Still Not Working

**Check these:**

1. **Backend is deployed and running:**
   ```bash
   curl https://your-backend.vercel.app/
   # Should return: "OK from Server"
   ```

2. **Environment variable is set correctly:**
   - Go to Vercel project settings
   - Check the exact value of `REACT_APP_SERVER_BASE_URL`
   - No trailing slashes!

3. **Backend has correct CORS:**
   - Backend `.env` should have: `FRONTEND_URL=https://your-frontend.vercel.app`
   - Backend deployed with latest code

4. **Clear cache and hard refresh:**
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Clear browser cache
   - Go back to your app
   - Try signup again

---

## Common Mistakes

❌ **Wrong:** `https://your-backend.vercel.app/` (trailing slash)
✅ **Correct:** `https://your-backend.vercel.app`

❌ **Wrong:** Using localhost in production
✅ **Correct:** Using vercel deployed backend URL

❌ **Not redeploying** frontend after env variable change
✅ **Always redeploy** with `vercel --prod`
