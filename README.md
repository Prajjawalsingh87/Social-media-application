# 🌆 Skyline - Social Media Application

A modern, full-stack social media platform built with React and Node.js featuring a premium glassmorphism UI design.

![Skyline Banner](https://img.shields.io/badge/Skyline-Social%20Media-8b5cf6?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🚀 Live Demo

| Platform | URL |
|----------|-----|
| **Frontend** | [https://social-media-application-xgbd-mvbv71fu.vercel.app](https://social-media-application-xgbd-mvbv71fu.vercel.app) |
| **Backend API** | [https://social-media-application-eta.vercel.app](https://social-media-application-eta.vercel.app) |

---

## ✨ Features

### Core Features
- 🔐 **Authentication** - Secure JWT-based login & signup with refresh tokens
- 📝 **Posts** - Create, view, and interact with image posts
- ❤️ **Likes** - Like/unlike posts with animated heart effects
- 👥 **Follow System** - Follow/unfollow users to customize your feed
- 👤 **Profiles** - View user profiles with stats and post grids
- 🔍 **Search** - Find users across the platform

### UI Features
- 🌈 **Premium Glassmorphism Design** - Modern translucent card effects
- ✨ **Animated Backgrounds** - Floating gradient orbs
- 💫 **Smooth Animations** - Staggered slide-up effects on posts
- 💖 **Heart Beat Animation** - Satisfying like interactions
- 📱 **Fully Responsive** - Works on all device sizes
- 🌙 **Dark Theme** - Easy on the eyes

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **Redux Toolkit** - State Management
- **React Router** - Navigation
- **Axios** - API Requests
- **SCSS** - Styling
- **React Toastify** - Notifications
- **React Icons** - Icon Library

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - Image Storage
- **Bcrypt** - Password Hashing

### Deployment
- **Vercel** - Frontend & Backend Hosting
- **MongoDB Atlas** - Cloud Database

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas Account
- Cloudinary Account

### Clone Repository
```bash
git clone https://github.com/Prajjawalsingh87/Social-media-application.git
cd Social-media-application
```

### Backend Setup
```bash
cd Social-Media-Application/server
npm install
```

Create a `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_PRIVATE_KEY=your_access_token_secret
REFRESH_TOKEN_PRIVATE_KEY=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the server:
```bash
npm start
```

### Frontend Setup
```bash
cd Social-Media-Application/client
npm install
```

Create a `.env` file (optional for local development):
```env
REACT_APP_SERVER_BASE_URL=http://localhost:4001
```

Start the client:
```bash
npm start
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/refresh` | Refresh access token |
| GET | `/auth/logout` | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/getMyInfo` | Get current user info |
| GET | `/user/getUserProfile/:id` | Get user profile |
| PUT | `/user/update` | Update profile |
| POST | `/user/follow` | Follow a user |
| POST | `/user/unfollow` | Unfollow a user |
| GET | `/user/getFeedData` | Get personalized feed |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/` | Create a new post |
| POST | `/posts/like` | Like/unlike a post |

---

## 🎨 UI Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0f` | Primary background |
| Card | `rgba(18, 18, 26, 0.85)` | Glass cards |
| Accent Primary | `#8b5cf6` | Purple accent |
| Accent Secondary | `#ec4899` | Pink accent |
| Success | `#10b981` | Success states |
| Error | `#f43f5e` | Error states |

---

## 📁 Project Structure

```
Social-Media-Application/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # State management
│   │   ├── utils/          # Utilities
│   │   └── index.css       # Global styles
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routers/            # Express routes
│   ├── utils/              # Utilities
│   ├── index.js            # Entry point
│   └── vercel.json         # Vercel config
│
└── README.md
```

---

## 🚀 Deployment

This project is configured for easy deployment on Vercel:

1. **Backend**: Deploy from `Social-Media-Application/server` with Framework Preset: "Other"
2. **Frontend**: Deploy from `Social-Media-Application/client` with Framework Preset: "Create React App"

Remember to set environment variables in Vercel dashboard!

---

## 👨‍💻 Author

**Prajjawal Singh**

- GitHub: [@Prajjawalsingh87](https://github.com/Prajjawalsingh87)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

### ⭐ Star this repo if you like it!

Made with 💜 by Prajjawal Singh

</div>
