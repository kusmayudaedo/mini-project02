import db from "./index.js";

//@define user models
const User = db.sequelize.define("users", {
  userId: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  username: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  phone: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  isVerified: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isDeleted: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  imgProfile: {
    type: db.Sequelize.STRING,
  },
});

export default User;
