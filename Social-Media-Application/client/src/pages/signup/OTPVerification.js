import React, { useState, useEffect, useCallback } from "react";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";
import AuthLayout from "../../components/authLayout/AuthLayout";

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
            if (result?.status === "ok" && result.result) {
                setOtpStatus(result.result);
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

            if (result?.status === "ok") {
                setOtp("");
                onVerificationSuccess();
            }
        } catch (error) {
            // Wrong / expired code - the server's message is already shown by axiosClient.
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            const result = await axiosClient.post("/auth/send-otp", { email });

            if (result?.status === "ok") {
                toast.success("A new code was sent to your email");
                setTimeLeft(300); // Reset timer to 5 minutes
                setOtp("");
                checkOTPStatus();
            }
        } catch (error) {
            // Already shown by axiosClient.
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Check your email"
            subtitle={
                <>
                    We sent a 6-digit code to
                    <br />
                    <span className="email-chip">{email}</span>
                </>
            }
        >
            <form onSubmit={handleVerifyOTP}>
                <div className="form-group">
                    <label htmlFor="otp">Verification code</label>
                    <input
                        type="text"
                        id="otp"
                        className="input otp-input"
                        placeholder="000000"
                        maxLength="6"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        disabled={loading}
                    />
                </div>

                <div className="timer">
                    {timeLeft > 0 ? (
                        <span className={timeLeft < 60 ? "warning" : ""}>
                            Code expires in {formatTime(timeLeft)}
                        </span>
                    ) : (
                        <span className="expired">Code has expired. Request a new one below.</span>
                    )}
                </div>

                <button
                    type="submit"
                    className="submit btn-primary btn-block"
                    disabled={loading || timeLeft === 0}
                >
                    {loading ? "Verifying..." : "Verify email"}
                </button>
            </form>

            <div className="resend-row">
                <span>Didn't receive the code?</span>
                <button
                    type="button"
                    className="link-btn"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                >
                    {resendLoading ? "Sending..." : "Resend code"}
                </button>
            </div>

            <button
                type="button"
                className="btn-ghost btn-block back-btn"
                onClick={onBackToSignup}
            >
                ← Back to sign up
            </button>

            {otpStatus && (
                <div className="status-info">
                    <span>Status: {otpStatus.hasOTP ? "Code sent" : "No code sent yet"}</span>
                    {otpStatus.expiresAt && (
                        <span>Expires at {new Date(otpStatus.expiresAt).toLocaleTimeString()}</span>
                    )}
                </div>
            )}
        </AuthLayout>
    );
}

export default OTPVerification;
