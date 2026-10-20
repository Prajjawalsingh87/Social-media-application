import React, { useEffect, useState } from "react";
import "./UpdateProfile.scss";
import dummyUserImg from "../../assets/user.png";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { updateMyProfile } from "../../redux/slices/appConfigSlice";
import toast from "react-hot-toast";
import { MAX_UPLOAD_BYTES, compressImage, readAsDataURL } from "../../utils/imageCompression";

function UpdateProfile() {
    const myProfile = useSelector((state) => state.appConfigReducer.myProfile);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [userImg, setUserImg] = useState("");
    const [saving, setSaving] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        setName(myProfile?.name || '');
        setBio(myProfile?.bio || '');
        setUserImg(myProfile?.avatar?.url)
    }, [myProfile]);

    async function handleImageChange(e) {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) {
            return;
        }
        try {
            // Avatars are shown small: 800 px is plenty.
            const result = await compressImage(file, { maxEdge: 800 });
            if (result.finalSize > MAX_UPLOAD_BYTES) {
                toast.error("Choose an image smaller than 5 MB.");
                return;
            }
            setUserImg(await readAsDataURL(result.blob));
        } catch (err) {
            toast.error(err.message || "Could not read this image. Try another file.");
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        dispatch(updateMyProfile({
            name,
            bio,
            userImg
        }))
            .unwrap()
            .then((result) => {
                toast.success("Profile updated successfully");
                navigate(`/profile/${result?.user?._id || myProfile?._id}`);
            })
            .catch(() => {
                toast.error("Unable to update profile");
            })
            .finally(() => {
                setSaving(false);
            });
    }

    return (
        <div className="UpdateProfile">
            <div className="container">
                <div className="page-header">
                    <h1>Edit profile</h1>
                    <p>Update your photo, name and bio. Changes are visible to everyone.</p>
                </div>

                <form className="card settings-card" onSubmit={handleSubmit}>
                    <div className="photo-row">
                        <img
                            className="photo-preview"
                            src={userImg ? userImg : dummyUserImg}
                            alt={name || "Profile"}
                        />
                        <div className="photo-actions">
                            <label htmlFor="inputImg" className="btn-secondary btn-sm">
                                Change photo
                            </label>
                            <input
                                className="inputImg"
                                id="inputImg"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <span className="hint">JPG or PNG, square images look best.</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            className="input"
                            value={name}
                            type="text"
                            placeholder="Your name"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            className="input"
                            value={bio}
                            rows={3}
                            placeholder="Tell people a little about yourself"
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>

                <section className="card danger-zone">
                    <div>
                        <h2>Delete account</h2>
                        <p>Permanently remove your account, posts and followers. This cannot be undone.</p>
                    </div>
                    <button type="button" className="btn-danger delete-account" title="Coming soon">
                        Delete account
                    </button>
                </section>
            </div>
        </div>
    );
}

export default UpdateProfile;
