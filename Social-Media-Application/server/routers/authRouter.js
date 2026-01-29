import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", authController.signupController);
router.post("/login", authController.loginController);
router.get("/refresh", authController.refreshAccessTokenController);
router.post("/logout", authController.logoutController);
router.post("/send-otp", authController.sendOTPController);
router.post("/verify-otp", authController.verifyOTPController);
router.post("/check-otp-status", authController.checkOTPStatusController);

export default router;
