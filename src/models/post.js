import db from "./index.js";
import User from "./user.js";

export const Post = db.sequelize.define("posts", {
  postId: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  categoryId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
  },
  thumbnail: {
    type: db.Sequelize.STRING,
  },
  keywords: {
    type: db.Sequelize.STRING,
  },
  country: {
    type: db.Sequelize.STRING,
  },
  isPublished: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  isDeleted: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalLike: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

export const Category = db.sequelize.define(
  "categories",
  {
    categoryId: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    categoryName: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

export const LikePost = db.sequelize.define(
  "likedposts",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    postId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

//@define relationship
User.hasMany(Post, { foreignKey: "userId" }); // User can have many posts
Post.belongsTo(User, { foreignKey: "userId" }); // Every post belongs to a particular user
Post.belongsTo(Category, { foreignKey: "categoryId" }); // Post has one category
Category.hasMany(Post, { foreignKey: "categoryId" }); // Category can be used in many posts
User.hasMany(LikePost, { foreignKey: "username" }); // User can like many posts
Post.hasMany(LikePost, { foreignKey: "postId" }); // Post can like by many users
LikePost.belongsTo(Post, { foreignKey: "postId" });
