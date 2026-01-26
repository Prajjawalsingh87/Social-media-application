import Post from "../models/Post.js";
import User from "../models/User.js";
import { success, error } from "../utils/responseWrapper.js";
import { v2 as cloudinary } from 'cloudinary';
import { mapPostOutput } from '../utils/Utils.js';

export const createPostController = async (req, res) => {
    try {
        const { caption, postImg } = req.body;
        if (!caption || !postImg) {
            return res.send(error(400, 'Caption and postImg are required'))
        }
        const cloudImg = await cloudinary.uploader.upload(postImg, {
            folder: 'postImg'
        })
        const owner = req._id;
        const user = await User.findById(req._id);
        const post = await Post.create({
            owner,
            caption,
            image: {
                publicId: cloudImg.public_id,
                url: cloudImg.url
            },
        });

        user.posts.push(post._id);
        await user.save();

        // console.log("user", user);
        // console.log("post", post);

        return res.json(success(200, { post }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

export const likeAndUnlikePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const curUserId = req._id;

        const post = await Post.findById(postId).populate('owner');
        if (!post) {
            return res.send(error(404, "Post not found"));
        }

        if (post.likes.includes(curUserId)) {
            const index = post.likes.indexOf(curUserId);
            post.likes.splice(index, 1);
        } else {
            post.likes.push(curUserId);
        }
        await post.save();
        return res.send(success(200, { post: mapPostOutput(post, req._id) }));

    } catch (e) {
        return res.send(error(500, e.message));
    }
};

export const updatePostController = async (req, res) => {
    try {
        const { postId, caption } = req.body;
        const curUserId = req._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.send(error(404, "Post not found"));
        }

        if (post.owner.toString() !== curUserId) {
            return res.send(error(403, "Only owners can update their posts"));
        }

        if (caption) {
            post.caption = caption;
        }

        await post.save();
        return res.send(success(200, { post }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const curUserId = req._id;

        const post = await Post.findById(postId);
        const curUser = await User.findById(curUserId);
        if (!post) {
            return res.send(error(404, "Post not found"));
        }

        if (post.owner.toString() !== curUserId) {
            return res.send(error(403, "Only owners can delete their posts"));
        }

        const index = curUser.posts.indexOf(postId);
        curUser.posts.splice(index, 1);
        await curUser.save();
        await post.remove();

        return res.send(success(200, "post deleted successfully"));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

export default {
    createPostController,
    likeAndUnlikePost,
    updatePostController,
    deletePost
};
