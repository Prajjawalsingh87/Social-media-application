import React, { useState } from "react";
import Avatar from "../avatar/Avatar";
import "./CreatePost.scss";
import { BsCardImage } from "react-icons/bs";
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
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
            if (fileReader.readyState === fileReader.DONE) {
                setPostImg(fileReader.result);
                console.log("img data", fileReader.result);
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

    return (
        <div className="CreatePost">
            <div className="left-part">
                <Avatar src={myProfile?.avatar?.url} />
            </div>
            <div className="right-part">
                <input
                    value={caption}
                    type="text"
                    className="captionInput"
                    placeholder="What's on your mind?"
                    onChange={(e) => setCaption(e.target.value)}
                />
                {postImg && (
                    <div className="img-container">
                        <img
                            className="post-img"
                            src={postImg}
                            alt="post-img"
                        />
                    </div>
                )}

                <div className="bottom-part">
                    <div className="input-post-img">
                        <label htmlFor="inputImg" className="labelImg">
                            <BsCardImage />
                        </label>
                        <input
                            className="inputImg"
                            id="inputImg"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    <button
                        className="post-btn btn-primary"
                        onClick={hanldePostSubmit}
                        disabled={posting}
                    >
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
