import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", authController.signupController);
router.post("/login", authController.loginController);
router.get("/refresh", authController.refreshAccessTokenController);
router.post("/logout", authController.logoutController);

export default router;
