import { Router } from "express";
import { verifyUser } from "../../midlewares/token.verify.js";

//@import controllers
import * as BlogController from "./index.js";

//@define route
const router = Router();
router.get("/", BlogController.getBlogByCategory);
router.get("/allCategory", BlogController.getCategory);
router.get("/pagFav", BlogController.getMostFavoritePosts);
router.get("/pagLike", verifyUser, BlogController.getLikeBlogByToken);
router.post("/like", verifyUser, BlogController.likeBlog);

export default router;
