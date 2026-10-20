import Post from "../models/Post.js";
import User from "../models/User.js";
import { success, error } from "../utils/responseWrapper.js";
import { v2 as cloudinary } from "cloudinary";
import { mapPostOutput } from "../utils/Utils.js";
import Notification from "../models/Notification.js";
import { notify } from "../utils/notify.js";
import { cursorFilter, pageOf, parseLimit } from "../utils/cursor.js";

const FEED_MAX_LIMIT = 30;

// One page of the home feed (posts by people the user follows), newest first.
export async function getFeedPage(userId, followingIds, { cursor, limit }) {
    const filter = { owner: { $in: followingIds } };
    const older = cursorFilter(cursor);
    if (older) Object.assign(filter, older);
    const rows = await Post.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate("owner");
    const { items, nextCursor } = pageOf(rows, limit);
    return { posts: items.map((item) => mapPostOutput(item, userId)), nextCursor };
}

export const followOrUnfollowUserController = async (req, res) => {
    try {
        const { userIdToFollow } = req.body;
        const curUserId = req._id;
        const userToFollow = await User.findById(userIdToFollow);
        const curUser = await User.findById(curUserId);
        if (curUserId === userIdToFollow) {
            return res.send(error(409, "Users cannot follow themselves"));
        }
        if (!userToFollow) {
            return res.send(error(404, "User to follow not found"));
        }
        let isNewFollow = false;
        if (curUser.followings.includes(userIdToFollow)) {
            // already followed
            const followingIndex = curUser.followings.indexOf(userIdToFollow);
            curUser.followings.splice(followingIndex, 1);
            const followerIndex = userToFollow.followers.indexOf(curUser);
            userToFollow.followers.splice(followerIndex, 1);
        } else {
            userToFollow.followers.push(curUserId);
            curUser.followings.push(userIdToFollow);
            isNewFollow = true;
        }
        await userToFollow.save();
        await curUser.save();
        if (isNewFollow) {
            await notify({ recipient: userToFollow._id, actor: curUserId, type: "follow" });
        }
        return res.send(success(200, { user: userToFollow }))
    } catch (e) {
        console.log(e);
        return res.send(error(500, e.message));
    }
};
export const getPostsOfFollowing = async (req, res) => {
    try {
        const curUserId = req._id;
        const curUser = await User.findById(curUserId).populate("followings");

        let posts;
        let nextCursor = null;
        if (req.query.limit) {
            // Paginated (infinite scroll): first page here, later pages via GET /api/feed.
            const limit = parseLimit(req.query.limit, 10, FEED_MAX_LIMIT);
            ({ posts, nextCursor } = await getFeedPage(req._id, curUser.followings.map((u) => u._id), { limit }));
        } else {
            // Unpaginated (original behaviour): every post, newest first.
            const fullPosts = await Post.find({
                owner: {
                    $in: curUser.followings,
                },
            }).populate('owner');

            posts = fullPosts
                .map((item) => mapPostOutput(item, req._id))
                .reverse();
        }

        const followingsIds = curUser.followings.map((item) => item._id);
        followingsIds.push(req._id);

        const suggestions = await User.find({
            _id: {
                $nin: followingsIds,
            },
        });

        return res.send(success(200, { ...curUser._doc, suggestions, posts, nextCursor }));
    } catch (e) {
        console.log(e);
        return res.send(error(500, e.message));
    }
};

export const getMyPosts = async (req, res) => {
    try {
        const curUserId = req._id;
        const allUserPosts = await Post.find({
            owner: curUserId,
        }).populate("likes");

        return res.send(success(200, { allUserPosts }));
    } catch (e) {
        console.log(e);
        return res.send(error(500, e.message));
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            return res.send(error(400, "userId is required"));
        }

        const allUserPosts = await Post.find({
            owner: userId,
        }).populate("likes");

        return res.send(success(200, { allUserPosts }));
    } catch (e) {
        console.log(e);
        return res.send(error(500, e.message));
    }
};

// Deletes the account and only what belongs to it: the user's posts (and their images),
// the user's likes on other posts, follow links pointing at the user, and notifications
// the user sent or received (or that point at the deleted posts).
export const deleteMyProfile = async (req, res) => {
    try {
        const curUserId = req._id;
        const curUser = await User.findById(curUserId);
        if (!curUser) {
            return res.send(error(404, "User not found"));
        }
        const userObjectId = curUser._id;

        const ownPosts = await Post.find({ owner: userObjectId }).select("_id image").lean();
        const ownPostIds = ownPosts.map((post) => post._id);
        const imageIds = ownPosts.map((post) => post.image?.publicId).filter(Boolean);
        if (curUser.avatar?.publicId) {
            imageIds.push(curUser.avatar.publicId);
        }

        await Post.deleteMany({ owner: userObjectId });
        // $pull only touches documents that actually reference this user.
        await Post.updateMany({ likes: userObjectId }, { $pull: { likes: userObjectId } });
        await User.updateMany(
            { $or: [{ followers: userObjectId }, { followings: userObjectId }] },
            { $pull: { followers: userObjectId, followings: userObjectId } }
        );
        await Notification.deleteMany({
            $or: [{ recipient: userObjectId }, { actor: userObjectId }, { post: { $in: ownPostIds } }],
        });
        await User.deleteOne({ _id: userObjectId });

        // Images last and best effort: a Cloudinary hiccup must not leave a half-deleted account.
        await Promise.allSettled(imageIds.map((id) => cloudinary.uploader.destroy(id)));

        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.send(success(200, "user deleted"));
    } catch (e) {
        console.log(e);
        return res.send(error(500, e.message));
    }
};

export const getMyInfo = async (req, res) => {
    try {
        const user = await User.findById(req._id);
        return res.send(success(200, { user }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, bio, userImg } = req.body;

        const user = await User.findById(req._id);

        if (name) {
            user.name = name;
        }
        if (bio) {
            user.bio = bio;
        }
        if (userImg) {
            const cloudImg = await cloudinary.uploader.upload(userImg, {
                folder: "profileImg",
            });
            user.avatar = {
                url: cloudImg.secure_url,
                publicId: cloudImg.public_id,
            };
        }
        await user.save();
        return res.send(success(200, { user }));
    } catch (e) {
        console.log('put e', e);
        return res.send(error(500, e.message));
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findById(userId).populate({
            path: "posts",
            populate: {
                path: "owner",
            },
        });

        const fullPosts = user.posts;
        const posts = fullPosts
            .map((item) => mapPostOutput(item, req._id))
            .reverse();

        return res.send(success(200, { ...user._doc, posts }));
    } catch (e) {
        console.log('error put', e);
        return res.send(error(500, e.message));
    }
};

// GET /api/feed?cursor=&limit= — the next page of the home feed.
export const getFeedNextPage = async (req, res) => {
    try {
        const curUser = await User.findById(req._id).select("followings").lean();
        const limit = parseLimit(req.query.limit, 10, FEED_MAX_LIMIT);
        const page = await getFeedPage(req._id, curUser.followings, { cursor: req.query.cursor, limit });
        return res.send(success(200, page));
    } catch (e) {
        if (e.status === 400) return res.send(error(400, e.message));
        console.log(e);
        return res.send(error(500, e.message));
    }
};

export default {
    getFeedNextPage,
    followOrUnfollowUserController,
    getPostsOfFollowing,
    getMyPosts,
    getUserPosts,
    deleteMyProfile,
    getMyInfo,
    updateUserProfile,
    getUserProfile,
};
