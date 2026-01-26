import React from "react";
import { AiOutlineHome, AiOutlineLogout, AiOutlineMail, AiOutlineSearch } from "react-icons/ai";
import { useNavigate } from "react-router";
import Avatar from "../avatar/Avatar";
import "./Navbar.scss";
import { useSelector } from 'react-redux';
import { KEY_ACCESS_TOKEN, removeItem } from "../../utils/localStorageManager";
import { axiosClient } from "../../utils/axiosClient";


function Navbar() {
    const navigate = useNavigate();
    const myProfile = useSelector(state => state.appConfigReducer.myProfile);

    async function handleLogoutClicked() {
        try {
            await axiosClient.post('/auth/logout');
            removeItem(KEY_ACCESS_TOKEN);
            navigate('/login')
        } catch (e) {

        }
    }

    return (
        <div className="Navbar glass">
            <div className="container">
                <div className="left-side">
                    <h2 className="banner hover-link" onClick={() => navigate("/")}>
                        Skyline
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
