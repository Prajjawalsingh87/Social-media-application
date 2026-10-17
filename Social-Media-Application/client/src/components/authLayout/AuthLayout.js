import React from "react";
import { BsCheck2 } from "react-icons/bs";
import "./AuthLayout.scss";

const HIGHLIGHTS = [
    "Share photos with the people who matter",
    "Follow friends and discover new creators",
    "A clean feed with no clutter",
];

// Split-screen shell shared by Login, Signup and OTP verification.
function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="AuthLayout">
            <aside className="brand-panel">
                <div className="brand-overlay" />
                <div className="brand-content">
                    <div className="brand">
                        <span className="brand-mark">S</span>
                        <span className="brand-name">Skyline Social</span>
                    </div>
                    <h2 className="brand-tagline">Stay close to your people.</h2>
                    <ul className="brand-highlights">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item}>
                                <BsCheck2 className="check" aria-hidden="true" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <main className="form-panel">
                <div className="form-card">
                    <div className="mobile-brand">
                        <span className="brand-mark">S</span>
                        <span className="brand-name">Skyline Social</span>
                    </div>
                    <h1 className="form-title">{title}</h1>
                    {subtitle && <p className="form-subtitle">{subtitle}</p>}
                    {children}
                    {footer && <div className="form-footer">{footer}</div>}
                </div>
            </main>
        </div>
    );
}

export default AuthLayout;
