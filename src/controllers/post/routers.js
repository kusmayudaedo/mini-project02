import { Router } from "express";
import path from "path";
import { verifyUser } from "../../midlewares/token.verify.js";
import { createThumbnailUploader } from "../../helpers/uploader.js";

const uploader = createThumbnailUploader(
  path.join(process.cwd(), "public", "images", "thumbnails")
);

//@import controllers
import * as BlogController from "./index.js";

//@define route
const router = Router();
router.get("/", BlogController.getBlogByCategory);
router.post(
  "/createPost",
  verifyUser,
  uploader.fields([{ name: "data" }, { name: "file" }]),
  BlogController.createBlog
);
router.get("/allCategory", BlogController.getCategory);
router.get("/pagFav", BlogController.getMostFavoritePosts);
router.get("/pagLike", verifyUser, BlogController.getLikeBlogByToken);
router.post("/like", verifyUser, BlogController.likeBlog);

export default router;
