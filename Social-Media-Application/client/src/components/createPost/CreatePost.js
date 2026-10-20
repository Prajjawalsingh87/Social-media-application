import React, { useRef, useState } from "react";
import Avatar from "../avatar/Avatar";
import "./CreatePost.scss";
import { BsCardImage } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { axiosClient } from "../../utils/axiosClient";
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from "../../redux/slices/postsSlice";
import { getFeedData } from "../../redux/slices/feedSlice";
import toast from "react-hot-toast";
import {
    ACCEPTED_IMAGE_TYPES,
    MAX_UPLOAD_BYTES,
    compressImage,
    formatBytes,
    readAsDataURL,
} from "../../utils/imageCompression";

function CreatePost() {
    const [postImg, setPostImg] = useState("");
    const [caption, setCaption] = useState('')
    const [posting, setPosting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [imgInfo, setImgInfo] = useState(null);
    // Only the latest photo selection may update state (an earlier one can finish later).
    const selectionRef = useRef(0);
    const dispatch = useDispatch();
    const myProfile = useSelector(state => state.appConfigReducer.myProfile);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = ""; // allow picking the same file again after removing it
        if (!file) {
            return;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Choose a JPEG, PNG, WebP, or GIF image.");
            return;
        }
        const selection = ++selectionRef.current;
        const isLatest = () => selection === selectionRef.current;
        setProcessing(true);
        try {
            const result = await compressImage(file);
            if (!isLatest()) return;
            // The 5 MB limit applies to what is actually uploaded.
            if (result.finalSize > MAX_UPLOAD_BYTES) {
                toast.error("Choose an image smaller than 5 MB.");
                return;
            }
            const dataUrl = await readAsDataURL(result.blob);
            if (!isLatest()) return;
            setPostImg(dataUrl);
            setImgInfo(result);
        } catch (err) {
            if (isLatest()) toast.error(err.message || "Could not read this image. Try another file.");
        } finally {
            if (isLatest()) setProcessing(false);
        }
    };

    const removeImage = () => {
        selectionRef.current += 1; // drop any conversion still running
        setProcessing(false);
        setPostImg("");
        setImgInfo(null);
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
            removeImage();
        } catch (error) {
            toast.error("Could not publish post");
        } finally {
            setPosting(false);
        }
    }

    const canPost = caption.trim() && postImg && !posting && !processing;

    return (
        <div className="CreatePost card">
            <div className="composer">
                <Avatar src={myProfile?.avatar?.url} />
                <textarea
                    value={caption}
                    className="caption-input"
                    placeholder={`What's on your mind${myProfile?.name ? `, ${myProfile.name.split(" ")[0]}` : ""}?`}
                    rows={2}
                    maxLength={2200}
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
                        onClick={removeImage}
                        aria-label="Remove image"
                        title="Remove image"
                    >
                        <IoClose />
                    </button>
                </div>
            )}

            {imgInfo && (
                <p className="composer-hint image-info" data-testid="image-info">
                    {imgInfo.compressed
                        ? `Compressed ${formatBytes(imgInfo.originalSize)} → ${formatBytes(imgInfo.finalSize)} · ${imgInfo.width}×${imgInfo.height} ${imgInfo.type === "image/webp" ? "WebP" : "JPEG"}`
                        : `Original kept · ${formatBytes(imgInfo.finalSize)}`}
                </p>
            )}
            {processing && <p className="composer-hint">Optimizing image…</p>}
            <p className="composer-hint">{caption.length} / 2,200 characters · Large photos are resized to 1600 px · Up to 5 MB after compression</p>
            <div className="composer-footer">
                <label htmlFor="inputImg" className="add-photo">
                    <BsCardImage className="add-photo-icon" />
                    <span>{processing ? "Optimizing…" : postImg ? "Change photo" : "Photo"}</span>
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
