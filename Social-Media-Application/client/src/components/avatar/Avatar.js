import React from "react";
import userImg from "../../assets/user.png";
import "./Avatar.scss";

// size: "sm" (32px) | "md" (40px, default) | "lg" (56px) | "xl" (120px)
function Avatar({ src, size = "md", alt = "User avatar" }) {
    return (
        <span className={`Avatar ${size}`}>
            <img src={src ? src : userImg} alt={alt} />
        </span>
    );
}

export default Avatar;
