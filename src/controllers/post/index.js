import { Post, Category, LikePost } from "../../models/post.js";
import User from "../../models/user.js";
import * as error from "../../midlewares/error.handler.js";
import db from "../../models/index.js";
import fs from "fs";
import path from "path";

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

    //@Pagination
    //@maximum post per page
    const pageSize = 10;
    let offset = 0;
    let limit = pageSize;
    let currentPage = 1;

    if (page && !isNaN(page)) {
      currentPage = page;
      offset = (currentPage - 1) * pageSize;
    }

    let queryOptions = {};

    //@query based on parameters
    if (id_cat) {
      queryOptions = {
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
        where: { categoryId: id_cat, isDeleted: 0 },
        order: [["createdAt", sort]],
        offset,
        limit,
      };
    } else {
      queryOptions = {
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
        where: { isDeleted: 0 },
        order: [["createdAt", "DESC"]],
        offset,
        limit,
      };
    }

    const { count, rows: posts } = await Post.findAndCountAll(queryOptions);

    const totalPages = Math.ceil(count / pageSize);

    //@send response
    res.status(200).json({
      totalPosts: count,
      postsLimit: limit,
      totalPages: totalPages,
      currentPage: parseInt(currentPage),
      result: posts,
    });
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
      where: { isDeleted: 0 },
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
    //@get query parameters
    const { page } = req.query;

    //@get user information by token
    const { username } = await User?.findOne({
      where: { userId: req.user.userId },
    });

    //@Pagination
    const pageSize = 10;
    let offset = 0;
    let limit = pageSize;
    let currentPage = 1;

    if (page && !isNaN(page)) {
      currentPage = page;
      offset = (currentPage - 1) * pageSize;
    }

    //@get the post liked by user
    const { count, rows: likePost } = await LikePost.findAndCountAll({
      where: { username: username },
      include: [
        {
          model: Post,
          attributes: ["postId", "title", "content", "thumbnail", "categoryId"],
          where: { isDeleted: 0 },
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
      offset,
      limit,
    });

    const totalPages = Math.ceil(count / pageSize);

    //@send response
    res.status(200).json({
      totalPosts: count,
      postsLimit: limit,
      totalPages: totalPages,
      currentPage: parseInt(currentPage),
      result: likePost,
    });
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

//@Create Blog
export const createBlog = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  const thumbnail = req?.files?.["file"][0].filename;
  try {
    //@read blogs data from form data
    const { data } = req.body;
    const body = JSON.parse(data);

    //@update data to database
    const posts = await Post?.create({
      title: body?.title,
      content: body?.content,
      userId: req?.user?.userId,
      categoryId: parseInt(body?.categoryId),
      thumbnail: "public/images/thumbnails/" + thumbnail,
      country: body?.country,
      keywords: body?.keywords,
    });

    //@send response
    res.status(200).json({ message: "Success Added", data: posts });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    //@delete image from storage
    fs.unlink(
      path.join(process.cwd(), "public", "images", "thumbnails", thumbnail),
      (error) => {
        if (error) {
          console.error("Error deleting file:", error);
          return;
        }
        console.log("File deleted successfully");
      }
    );
    next(error);
  }
};

//@Like Blog
export const deleteBlog = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get post id from body
    const { postId } = req.body;

    //@check if the postId exist
    const isPostIdExist = await Post?.findOne({ where: { postId: postId } });
    if (!isPostIdExist || isPostIdExist?.dataValues?.isDeleted === 1)
      throw { status: 400, message: error.NOT_FOUND };

    //@check for userId
    if (!(req.user?.userId === isPostIdExist.userId))
      throw { status: 401, message: error.RESTRICTED };

    //@update isDeleted status
    await Post?.update(
      {
        isDeleted: 1,
      },
      { where: { postId: postId } }
    );

    //@send Response
    res.status(200).json({ message: "Post deleted successfully" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

//@viem user profile image
export const viewImage = async (req, res, next) => {
  try {
    //@get post id from body
    const { folder, file } = req.params;
    const image = path.join(process.cwd(), "public", "images", folder, file);
    //@send response
    res.status(200).sendFile(image);
  } catch (error) {
    next(error);
  }
};
