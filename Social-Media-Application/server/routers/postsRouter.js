import express from "express";
import postsController from "../controllers/postsController.js";
import requireUser from "../middlewares/requireUser.js";
const router = express.Router();

router.post("/", requireUser, postsController.createPostController);
router.post("/like", requireUser, postsController.likeAndUnlikePost);
router.put('/', requireUser, postsController.updatePostController);
router.delete('/', requireUser, postsController.deletePost);

export default router;
