import React, { useState, useEffect, useCallback } from "react";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";
import "./OTPVerification.scss";

function OTPVerification({ email, onVerificationSuccess, onBackToSignup }) {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [otpStatus, setOtpStatus] = useState(null);

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Check OTP status function with useCallback to avoid dependency issues
    const checkOTPStatus = useCallback(async () => {
        try {
            const result = await axiosClient.post("/auth/check-otp-status", { email });
            if (result.data.data) {
                setOtpStatus(result.data.data);
            }
        } catch (error) {
            console.log("Error checking OTP status:", error);
        }
    }, [email]);

    // Check OTP status on mount
    useEffect(() => {
        checkOTPStatus();
    }, [checkOTPStatus]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const result = await axiosClient.post("/auth/verify-otp", {
                email,
                otp,
            });

            if (result.data.success) {
                toast.success("Email verified successfully!");
                setOtp("");
                onVerificationSuccess();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to verify OTP";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            const result = await axiosClient.post("/auth/send-otp", { email });

            if (result.data.success) {
                toast.success("OTP sent to your email");
                setTimeLeft(300); // Reset timer to 5 minutes
                setOtp("");
                checkOTPStatus();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to send OTP";
            toast.error(errorMsg);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="OTPVerification">
            <div className="otp-box glass">
                <h2 className="heading">Verify Your Email</h2>

                <div className="email-display">
                    <p>Verification code sent to:</p>
                    <p className="email-value">{email}</p>
                </div>

                <form onSubmit={handleVerifyOTP}>
                    <div className="form-group">
                        <label htmlFor="otp">Enter OTP</label>
                        <input
                            type="text"
                            id="otp"
                            className="otp-input"
                            placeholder="000000"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            disabled={loading}
                        />
                        <small className="otp-hint">6-digit code</small>
                    </div>

                    <div className="timer">
                        {timeLeft > 0 ? (
                            <span className={timeLeft < 60 ? "warning" : ""}>
                                Code expires in: {formatTime(timeLeft)}
                            </span>
                        ) : (
                            <span className="expired">Code has expired</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="submit btn-primary"
                        disabled={loading || timeLeft === 0}
                    >
                        {loading ? "Verifying..." : "Verify"}
                    </button>
                </form>

                <div className="resend-section">
                    <p>Didn't receive the code?</p>
                    <button
                        type="button"
                        className="resend-btn"
                        onClick={handleResendOTP}
                        disabled={resendLoading}
                    >
                        {resendLoading ? "Sending..." : "Resend OTP"}
                    </button>
                </div>

                <button
                    type="button"
                    className="back-btn"
                    onClick={onBackToSignup}
                >
                    ← Back to Signup
                </button>

                {otpStatus && (
                    <div className="status-info">
                        <p>OTP Status: {otpStatus.hasOTP ? "✓ Valid" : "✗ Not sent"}</p>
                        {otpStatus.expiresAt && (
                            <p className="expires">
                                Expires at: {new Date(otpStatus.expiresAt).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OTPVerification;
