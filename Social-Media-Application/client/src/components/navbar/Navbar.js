import React, { useEffect, useRef, useState } from "react";
import { AiOutlineHome, AiFillHome, AiOutlineLogout, AiOutlineMessage, AiOutlineSearch } from "react-icons/ai";
import { BsMoonStars, BsSun } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
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
    const isSearchPage = location.pathname === "/search";
    const [searchParams] = useSearchParams();
    const urlQuery = isSearchPage ? searchParams.get("q") || "" : "";
    const urlTab = searchParams.get("tab");
    const [term, setTerm] = useState(urlQuery);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Keep the box in sync when the URL changes (hashtag links, back button, leaving search).
    useEffect(() => {
        // Keep what is being typed (e.g. a trailing space) when it already matches the URL.
        setTerm((prev) => (prev.trim() === urlQuery.trim() ? prev : urlQuery));
    }, [urlQuery]);

    // Ctrl+K / Cmd+K (or "/" outside text fields) jumps to search from anywhere.
    useEffect(() => {
        function onKeyDown(e) {
            const typing = ["INPUT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable;
            if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
                e.preventDefault();
                const input = inputRef.current;
                if (input && input.offsetParent !== null) {
                    input.focus();
                    input.select();
                } else {
                    // Navbar search is hidden on small screens; the search page has its own box.
                    navigate("/search");
                }
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [navigate]);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    function goToSearch(value, replace) {
        const q = value.trim();
        const tab = isSearchPage && urlTab ? `&tab=${urlTab}` : "";
        navigate(q ? `/search?q=${encodeURIComponent(q)}${tab}` : "/search", { replace });
    }

    function handleSearchChange(e) {
        const value = e.target.value;
        setTerm(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            // Live results while typing; only the first keystroke adds a history entry.
            if (value.trim() || isSearchPage) goToSearch(value, isSearchPage);
        }, 300);
    }

    function handleSearchKeyDown(e) {
        if (e.key === "Enter") {
            clearTimeout(debounceRef.current);
            goToSearch(term, isSearchPage);
        } else if (e.key === "Escape") {
            e.currentTarget.blur();
        }
    }

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
                    <span className="brand-mark">O</span>
                    <span className="brand-name">Orbit</span>
                </button>

                <label className="search-bar">
                    <AiOutlineSearch className="search-icon" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="search"
                        placeholder="Search people, posts, #tags"
                        aria-label="Search Orbit"
                        value={term}
                        maxLength={100}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {!term && <kbd className="shortcut" aria-hidden="true">Ctrl K</kbd>}
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
                    <button
                        type="button"
                        className={`icon-btn mobile-search ${isSearchPage ? "active" : ""}`}
                        onClick={() => navigate("/search")}
                        title="Search"
                        aria-label="Search"
                    >
                        <AiOutlineSearch />
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
