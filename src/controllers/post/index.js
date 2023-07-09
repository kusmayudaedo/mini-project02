import { USER_DOES_NOT_EXISTS } from "../../midlewares/error.handler.js";
import { Post, Category, LikePost } from "../../models/post.js";
import User from "../../models/user.js";
import * as error from "../../midlewares/error.handler.js";
import db from "../../models/index.js";

//@get all Categories controller
export const getCategory = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    //@send response
    res.status(200).json({ result: categories });
  } catch (error) {
    next(error);
  }
};

//@get blogs by category controller
export const getBlogByCategory = async (req, res, next) => {
  try {
    //@get query parameters
    const { id_cat, sort, page } = req.query;

    if (id_cat || sort || page) {
      //@query based on parameters
      const posts = await Post.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "imgProfile"],
          },
          {
            model: Category,
            attributes: ["categoryId", "categoryName"],
          },
        ],
        where: { categoryId: id_cat },
        order: [["createdAt", sort]],
      });
      //@send response
      res.status(200).json({ result: posts });
    } else {
      const posts = await Post.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "imgProfile"],
          },
          {
            model: Category,
            attributes: ["categoryId", "categoryName"],
          },
        ],
      });
      res.status(200).json({ result: posts });
    }
  } catch (error) {
    next(error);
  }
};

//@get most favorite posts
export const getMostFavoritePosts = async (req, res, next) => {
  try {
    const favoritePosts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["username", "imgProfile"],
        },
        {
          model: Category,
          attributes: ["categoryId", "categoryName"],
        },
        {
          model: LikePost,
          attributes: ["username", "postId"],
        },
      ],
      order: [["totalLike", "DESC"]],
      limit: 10,
    });

    //@send response
    res.status(200).json({ result: favoritePosts });
  } catch (error) {
    next(error);
  }
};

//@get Liked posts with token
export const getLikeBlogByToken = async (req, res, next) => {
  try {
    //@get user information by token
    const { username } = await User?.findOne({
      where: { userId: req.user.userId },
    });

    //@get the post liked by user
    const likePost = await LikePost.findAll({
      where: { username: username },
      include: [
        {
          model: Post,
          attributes: ["postId", "title", "content", "thumbnail", "categoryId"],
          include: [
            {
              model: Category,
              attributes: ["categoryId", "categoryName"],
            },
            {
              model: User,
              attributes: ["userId", "username", "imgProfile"],
            },
          ],
        },
      ],
    });
    //@send response
    res.status(200).json({ result: likePost });
  } catch (error) {
    next(error);
  }
};

//@Like Blog
export const likeBlog = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get post id from body
    const { postId } = req.body;

    //get user information
    const { username } = await User?.findOne({
      where: { userId: req.user.userId },
    });

    //@check if the postId exist
    const isPostIdExist = await Post?.findOne({ where: { postId: postId } });
    if (!isPostIdExist) throw { status: 400, message: error.NOT_FOUND };

    //@check if user already like the post
    const isAlreadyLike = await LikePost?.findOne({
      where: { username: username, postId: postId },
    });
    if (isAlreadyLike) {
      return res.status(200).json({ message: "You already liked this post" });
    }
    //@add liked post to database
    await LikePost.create({
      username: username,
      postId: postId,
    });

    //@add totalLike by 1
    await Post?.update(
      {
        totalLike: isPostIdExist?.dataValues?.totalLike + 1,
      },
      { where: { postId: postId } }
    );

    //@send Response
    res.status(200).json({ message: "You liked this post" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
