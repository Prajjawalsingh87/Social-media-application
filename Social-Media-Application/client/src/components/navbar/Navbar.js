import React, { useEffect, useState } from "react";
import { AiOutlineHome, AiOutlineLogout, AiOutlineMail, AiOutlineSearch } from "react-icons/ai";
import { BsMoonStars, BsSun } from "react-icons/bs";
import { useNavigate } from "react-router";
import Avatar from "../avatar/Avatar";
import "./Navbar.scss";
import { useSelector } from 'react-redux';
import { KEY_ACCESS_TOKEN, getItem, removeItem, setItem } from "../../utils/localStorageManager";
import { axiosClient } from "../../utils/axiosClient";

const KEY_THEME_MODE = "theme_mode";

function Navbar() {
    const navigate = useNavigate();
    const myProfile = useSelector(state => state.appConfigReducer.myProfile);
    const [isLightMode, setIsLightMode] = useState(getItem(KEY_THEME_MODE) === "light");

    useEffect(() => {
        const currentTheme = getItem(KEY_THEME_MODE) === "light" ? "light" : "dark";
        document.body.dataset.theme = currentTheme;
        setIsLightMode(currentTheme === "light");
    }, []);

    async function handleLogoutClicked() {
        try {
            await axiosClient.post('/auth/logout');
            removeItem(KEY_ACCESS_TOKEN);
            navigate('/login')
        } catch (e) {

        }
    }

    function handleThemeToggle() {
        const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
        document.body.dataset.theme = nextTheme;
        setItem(KEY_THEME_MODE, nextTheme);
        setIsLightMode(nextTheme === "light");
    }

    return (
        <div className="Navbar glass">
            <div className="container">
                <div className="left-side">
                <h2 className="banner hover-link" onClick={() => navigate("/")}>
                        Skyline Social
                </h2>
                </div>

                <div className="center-side">
                    <div className="search-bar">
                        <AiOutlineSearch className="icon" />
                        <input type="text" placeholder="Search Skyline..." />
                    </div>
                </div>
                <div className="right-side">
                    <div className="nav-icons">
                        <AiOutlineHome className="nav-icon hover-link" onClick={() => navigate("/")} />
                        <AiOutlineMail className="nav-icon hover-link" />
                    </div>
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={handleThemeToggle}
                        aria-label="Toggle theme"
                    >
                        {isLightMode ? <BsMoonStars /> : <BsSun />}
                    </button>
                    <div
                        className="profile hover-link"
                        onClick={() => navigate(`/profile/${myProfile?._id}`)}
                    >
                        <Avatar src={myProfile?.avatar?.url} />
                    </div>
                    <div className="logout hover-link" onClick={handleLogoutClicked}>
                        <AiOutlineLogout />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
