import React, { useState } from "react";
import Avatar from "../avatar/Avatar";
import "./CreatePost.scss";
import { BsCardImage } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { axiosClient } from "../../utils/axiosClient";
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from "../../redux/slices/postsSlice";
import { getFeedData } from "../../redux/slices/feedSlice";
import toast from "react-hot-toast";

function CreatePost() {
    const [postImg, setPostImg] = useState("");
    const [caption, setCaption] = useState('')
    const [posting, setPosting] = useState(false);
    const dispatch = useDispatch();
    const myProfile = useSelector(state => state.appConfigReducer.myProfile);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        e.target.value = ""; // allow picking the same file again after removing it
        if (!file) {
            return;
        }
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
            if (fileReader.readyState === fileReader.DONE) {
                setPostImg(fileReader.result);
            }
        };
    };

    const hanldePostSubmit = async () => {
        if (!caption.trim() || !postImg) {
            toast.error("Add a caption and image before posting");
            return;
        }

        setPosting(true);
        try {
            await axiosClient.post('/posts', {
                caption,
                postImg
            });
            await Promise.all([
                dispatch(getUserProfile({ userId: myProfile?._id })),
                dispatch(getFeedData()),
            ]);
            toast.success("Post published to your feed");
            setCaption('');
            setPostImg('');
        } catch (error) {
            toast.error("Could not publish post");
        } finally {
            setPosting(false);
        }
    }

    const canPost = caption.trim() && postImg && !posting;

    return (
        <div className="CreatePost card">
            <div className="composer">
                <Avatar src={myProfile?.avatar?.url} />
                <textarea
                    value={caption}
                    className="caption-input"
                    placeholder={`What's on your mind${myProfile?.name ? `, ${myProfile.name.split(" ")[0]}` : ""}?`}
                    rows={2}
                    onChange={(e) => setCaption(e.target.value)}
                    aria-label="Post caption"
                />
            </div>

            {postImg && (
                <div className="img-preview">
                    <img src={postImg} alt="Selected for your post" />
                    <button
                        type="button"
                        className="remove-img"
                        onClick={() => setPostImg("")}
                        aria-label="Remove image"
                        title="Remove image"
                    >
                        <IoClose />
                    </button>
                </div>
            )}

            <div className="composer-footer">
                <label htmlFor="inputImg" className="add-photo">
                    <BsCardImage className="add-photo-icon" />
                    <span>{postImg ? "Change photo" : "Photo"}</span>
                </label>
                <input
                    className="inputImg"
                    id="inputImg"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                <button
                    type="button"
                    className="btn-primary"
                    onClick={hanldePostSubmit}
                    disabled={!canPost}
                >
                    {posting ? "Posting..." : "Post"}
                </button>
            </div>
        </div>
    );
}

export default CreatePost;
