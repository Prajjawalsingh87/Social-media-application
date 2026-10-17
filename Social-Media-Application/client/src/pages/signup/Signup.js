import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";
import OTPVerification from "./OTPVerification";
import AuthLayout from "../../components/authLayout/AuthLayout";
import PasswordInput from "../../components/passwordInput/PasswordInput";

function Signup() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [signupEmail, setSignupEmail] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        if (!name || !email || !password) {
            toast.error("All fields are required");
            return;
        }

        // axiosClient resolves with the response body ({ status: "ok", result }) and,
        // on failure, has already shown the server's error message as a toast.
        setLoading(true);
        let accountCreated = false;
        try {
            const result = await axiosClient.post("/auth/signup", {
                name,
                email,
                password,
            });
            accountCreated = result?.status === "ok";
        } catch (error) {
            // e.g. "User is already registered" - already shown by axiosClient
        }

        if (!accountCreated) {
            setLoading(false);
            return;
        }

        try {
            await axiosClient.post("/auth/send-otp", { email });
            toast.success("Account created! Enter the code we emailed you.");
            setSignupEmail(email);
            setShowOTPVerification(true);
        } catch (error) {
            // The account exists even if the verification email could not be sent.
            navigate("/login", {
                state: {
                    email,
                    message: "Account created. We couldn't send the verification email, but you can log in now.",
                },
            });
        } finally {
            setLoading(false);
        }
    }

    const handleVerificationSuccess = () => {
        toast.success("Email verified! You can now login.");
        navigate("/login", {
            state: {
                email,
                message: "Account verified successfully. Please log in.",
            },
        });
    };

    const handleBackToSignup = () => {
        setShowOTPVerification(false);
        setName("");
        setEmail("");
        setPassword("");
        setSignupEmail("");
    };

    if (showOTPVerification) {
        return (
            <OTPVerification
                email={signupEmail}
                onVerificationSuccess={handleVerificationSuccess}
                onBackToSignup={handleBackToSignup}
            />
        );
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="It only takes a minute. We'll send a code to verify your email."
            footer={<>Already have an account? <Link to="/login">Log in</Link></>}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Full name</label>
                    <input
                        type="text"
                        className="input"
                        id="name"
                        placeholder="Jane Doe"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        className="input"
                        id="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <PasswordInput
                        id="password"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="submit btn-primary btn-block"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default Signup;
