import React, { useEffect, useState } from "react";
import "./UpdateProfile.scss";
import dummyUserImg from "../../assets/user.png";
import { useSelector, useDispatch } from "react-redux";
import { updateMyProfile } from "../../redux/slices/appConfigSlice";
import toast from "react-hot-toast";

function UpdateProfile() {
    const myProfile = useSelector((state) => state.appConfigReducer.myProfile);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [userImg, setUserImg] = useState("");
    const [saving, setSaving] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        setName(myProfile?.name || '');
        setBio(myProfile?.bio || '');
        setUserImg(myProfile?.avatar?.url)
    }, [myProfile]);

    function handleImageChange(e) {
        const file = e.target.files[0];
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
            if (fileReader.readyState === fileReader.DONE) {
                setUserImg(fileReader.result)
                console.log('img data', fileReader.result);
            }
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
            .then(() => {
                toast.success("Profile updated successfully");
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
                <div className="left-part">
                    <div className="input-user-img">
                        <label htmlFor="inputImg" className="labelImg">
                            <img src={userImg ? userImg : dummyUserImg} alt={name} />
                        </label>
                        <input
                            className="inputImg"
                            id="inputImg"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>
                <div className="right-part">
                    <div className="header">
                        <h2>Update your profile</h2>
                        <p>Refresh your name, bio, and avatar in one place.</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            value={name}
                            type="text"
                            placeholder="Your Name"
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            value={bio}
                            type="text"
                            placeholder="Your Bio"
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>

                    <button type="button" className="delete-account">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdateProfile;
