import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { axiosClient } from "../../utils/axiosClient";
import { KEY_ACCESS_TOKEN, setItem } from "../../utils/localStorageManager";
import toast from "react-hot-toast";
import AuthLayout from "../../components/authLayout/AuthLayout";
import PasswordInput from "../../components/passwordInput/PasswordInput";


function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
        if (location.state?.message) {
            toast.success(location.state.message);
        }
    }, [location.state]);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const response = await axiosClient.post('/auth/login', {
                email,
                password
            });

            setItem(KEY_ACCESS_TOKEN, response.result.accessToken);
            navigate('/');

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to see what your friends are sharing."
            footer={<>Don't have an account? <Link to="/signup">Sign up</Link></>}
        >
            <form onSubmit={handleSubmit}>
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
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <PasswordInput
                        id="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit" className="submit btn-primary btn-block">Log in</button>
            </form>
        </AuthLayout>
    );
}

export default Login;
