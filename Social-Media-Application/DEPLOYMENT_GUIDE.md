# Deployment Guide - Social Media Application

## Overview
Your project is already configured for **Vercel deployment** with a `vercel.json` file in the server folder.

---

## **Backend Deployment (Vercel)**

### Current Setup ✅
- `vercel.json` is already configured in `/server` directory
- Runs on Node.js with Express

### Steps to Deploy Backend:

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from server directory**:
   ```bash
   cd Social-Media-Application/server
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add all variables from your `.env` file:
     ```
     MONGODB_URI=your_mongodb_uri
     ACCESS_TOKEN_PRIVATE_KEY=your_key
     REFRESH_TOKEN_PRIVATE_KEY=your_key
     CLOUDINARY_CLOUD_NAME=your_cloudinary
     CLOUDINARY_API_KEY=your_key
     CLOUDINARY_API_SECRET=your_secret
     EMAIL_SERVICE=gmail
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASSWORD=your_app_password
     ```

5. **Backend URL** will be something like: `https://your-project.vercel.app`

---

## **Frontend Deployment (Vercel)**

### Setup for Frontend:

1. **Create `vercel.json` in client folder**:
   ```bash
   cd Social-Media-Application/client
   ```

2. Create file named `vercel.json`:
   ```json
   {
       "rewrites": [
           {
               "source": "/(.*)",
               "destination": "/"
           }
       ]
   }
   ```

3. **Update API Base URL** in `src/utils/axiosClient.js`:
   ```javascript
   const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4001";
   ```

4. **Deploy frontend**:
   ```bash
   cd Social-Media-Application/client
   vercel
   ```

5. **Add Environment Variable in Vercel**:
   - Go to Project Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://your-backend.vercel.app`

---

## **Complete Deployment Checklist**

- [ ] Backend deployed on Vercel
- [ ] All environment variables set
- [ ] Frontend deployed on Vercel
- [ ] Frontend connected to backend API
- [ ] Test signup with OTP verification
- [ ] Test login functionality
- [ ] Test email notifications

---

## **Step-by-Step Git Push & Deploy**

### 1. Initialize Git (if not already done):
```bash
cd /home/prajjawal-singh/Desktop/My\ Projects/Social-media-application/Social-Media-Application
git init
git add .
git commit -m "Initial commit with OTP verification"
git branch -M main
```

### 2. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/social-media-app.git
git push -u origin main
```

### 3. Connect to Vercel:
```bash
# Deploy backend
cd server
vercel --link-to-existing

# Deploy frontend
cd ../client
vercel --link-to-existing
```

### 4. Enable Auto-Deploy:
- Connect your GitHub repo in Vercel dashboard
- Vercel will auto-deploy on every `git push`

---

## **Production URLs After Deployment**

```
🔗 Backend API: https://your-backend.vercel.app
🔗 Frontend App: https://your-frontend.vercel.app
```

---

## **Verify Deployment**

Test the OTP verification in production:

```bash
# From Postman or cURL:
curl -X POST https://your-backend.vercel.app/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## **Important Notes**

⚠️ **Make sure to:**
- Never commit `.env` file (already in `.gitignore`)
- Set all environment variables in Vercel dashboard
- Test on staging before production
- Keep MongoDB connection string secret
- Enable 2FA for your email account (for OTP functionality)

---

## **Troubleshooting**

### OTP not sending in production?
- Check email credentials in Vercel environment variables
- Verify Gmail App Password is set correctly
- Check email service is not blocked

### API calls failing?
- Verify backend URL in frontend environment variables
- Check CORS configuration in backend
- Ensure MongoDB connection is accessible

### Frontend showing 404?
- Make sure `vercel.json` is in client folder
- Clear browser cache and restart dev server
