import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";
import OTPVerification from "./OTPVerification";
import "./Signup.scss";

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

        setLoading(true);
        try {
            const result = await axiosClient.post("/auth/signup", {
                name,
                email,
                password,
            });

            if (result.data.success) {
                toast.success("Account created! Please verify your email.");
                setSignupEmail(email);
                
                // Send OTP to email
                await axiosClient.post("/auth/send-otp", { email });
                setShowOTPVerification(true);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Signup failed";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const handleVerificationSuccess = () => {
        toast.success("Email verified! You can now login.");
        navigate("/login");
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
        <div className="Signup">
            <div className="signup-box glass">
                <h2 className="heading">Signup</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            className="name"
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            className="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            className="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Signup"}
                    </button>
                </form>
                <p className="subheading">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
