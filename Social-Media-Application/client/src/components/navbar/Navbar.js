import React, { useState } from "react";
import { AiOutlineHome, AiFillHome, AiOutlineLogout, AiOutlineMessage, AiOutlineSearch } from "react-icons/ai";
import { BsMoonStars, BsSun } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router";
import Avatar from "../avatar/Avatar";
import "./Navbar.scss";
import { useSelector } from 'react-redux';
import { KEY_ACCESS_TOKEN, removeItem } from "../../utils/localStorageManager";
import { axiosClient } from "../../utils/axiosClient";
import { saveTheme } from "../../utils/theme";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const myProfile = useSelector(state => state.appConfigReducer.myProfile);
    const [isDarkMode, setIsDarkMode] = useState(document.body.dataset.theme === "dark");
    const isHome = location.pathname === "/";

    async function handleLogoutClicked() {
        try {
            await axiosClient.post('/auth/logout');
            removeItem(KEY_ACCESS_TOKEN);
            navigate('/login')
        } catch (e) {

        }
    }

    function handleThemeToggle() {
        const nextTheme = isDarkMode ? "light" : "dark";
        saveTheme(nextTheme);
        setIsDarkMode(nextTheme === "dark");
    }

    return (
        <header className="Navbar">
            <div className="navbar-inner">
                <button type="button" className="brand" onClick={() => navigate("/")}>
                    <span className="brand-mark">S</span>
                    <span className="brand-name">Skyline Social</span>
                </button>

                <label className="search-bar">
                    <AiOutlineSearch className="search-icon" aria-hidden="true" />
                    <input type="search" placeholder="Search Skyline" aria-label="Search" />
                </label>

                <nav className="actions" aria-label="Main">
                    <button
                        type="button"
                        className={`icon-btn ${isHome ? "active" : ""}`}
                        onClick={() => navigate("/")}
                        title="Home"
                        aria-label="Home"
                    >
                        {isHome ? <AiFillHome /> : <AiOutlineHome />}
                    </button>
                    <button type="button" className="icon-btn" title="Messages (coming soon)" aria-label="Messages">
                        <AiOutlineMessage />
                    </button>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={handleThemeToggle}
                        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <BsSun /> : <BsMoonStars />}
                    </button>

                    <span className="divider" aria-hidden="true" />

                    <button
                        type="button"
                        className="profile-btn"
                        onClick={() => navigate(`/profile/${myProfile?._id}`)}
                        title="Your profile"
                    >
                        <Avatar src={myProfile?.avatar?.url} size="sm" />
                        <span className="profile-name">{myProfile?.name}</span>
                    </button>
                    <button
                        type="button"
                        className="icon-btn logout"
                        onClick={handleLogoutClicked}
                        title="Log out"
                        aria-label="Log out"
                    >
                        <AiOutlineLogout />
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
