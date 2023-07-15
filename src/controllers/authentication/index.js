import User from "../../models/user.js";
import * as helpers from "../../helpers/index.js";
import * as Validation from "./validation.js";
import * as config from "../../config/index.js";
import { ValidationError } from "yup";
import * as error from "../../midlewares/error.handler.js";
import db from "../../models/index.js";
import * as encryption from "../../helpers/encryption.js";

//@register constroller
export const register = async (req, res, next) => {
  //@Sequelize transaction
  const transaction = await db.sequelize.transaction();
  try {
    const { username, email, phone, password } = req.body;
    console.log(username, email, phone, password);
    await Validation.RegisterValidationSchema.validate(req.body);

    //@check if user is already registered
    const userExists = await User?.findOne({ where: { username, email } });
    if (userExists) throw { status: 400, message: error.USER_ALREADY_EXISTS };

    //@encrypt user password using bcrypt
    const encryptedPassword = helpers.hashPassword(password);
    const user = await User.create({
      username,
      email,
      phone,
      password: encryptedPassword,
    });

    //@delete data password before sending response
    delete user?.dataValues?.password;

    //@generate access token
    const accessToken = helpers.createToken({
      userId: user?.dataValues?.userId,
      role: user?.dataValues?.role,
    });

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Register successful", data: user });

    //@Send verification link via email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Verification Account",
      html: `<h1>Click <a href="http://localhost:5000/api/auth/verify/${accessToken}">here</a> to verify your account</h1>`,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    // @commit transaction
    await transaction.commit();
  } catch (error) {
    // @rollback transaction
    await transaction.rollback();

    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@login controller
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    await Validation.LoginValidationSchema.validate(req.body);

    //@check if user exists
    const userExists = await User?.findOne({ where: { username } });
    if (!userExists) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    //@check password
    const isPasswordCorrect = helpers.comparePassword(
      password,
      userExists?.dataValues?.password
    );
    if (!isPasswordCorrect)
      throw { status: 400, message: error.INVALID_CREDENTIALS };

    //@check if user verified
    if (userExists?.dataValues?.isVerified === 0)
      throw { status: 400, message: error.USER_UNVERIFIED };

    //@generate access token
    const accessToken = helpers.createToken({
      userId: userExists?.dataValues?.userId,
      role: userExists?.dataValues?.role,
    });

    //@delete password before sending response
    delete userExists?.dataValues?.password;

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Login Successfull", data: userExists });
  } catch (error) {
    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@verify account constroller
export const verifyAccount = async (req, res, next) => {
  try {
    //@get token params
    const { token } = req.params;

    //@verify the token
    const decodedToken = helpers.verifyToken(token);

    //@update isVerified field to 1
    await User?.update(
      { isVerified: 1 },
      { where: { userId: decodedToken?.userId } }
    );
    // @return response
    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    next(error);
  }
};

//@keep Login constroller
export const keepLogin = async (req, res, next) => {
  try {
    //@asume frontend send the request using header authorization
    const token = req.headers.authorization?.split(" ")[1];
    const decodedToken = helpers.verifyToken(token);

    const user = await User?.findOne({
      where: { userId: decodedToken?.userId },
    });

    //@delete password before sending response
    delete user?.dataValues?.password;

    //@send response
    res.status(200).json({ user });
  } catch (error) {
    // @check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@change username constroller
export const changeUsername = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get body from request
    const { currentUsername, newUsername } = req.body;
    await Validation.changeUsernameSchema.validate(req.body);

    //@check if username exists
    const userExists = await User?.findOne({
      where: { username: currentUsername, userId: req.user?.userId },
    });
    if (!userExists) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    //@check if new username is already exists
    const isNewUsernameExist = await User?.findOne({
      where: { username: newUsername },
    });
    if (isNewUsernameExist)
      throw { status: 400, message: error.USER_ALREADY_EXISTS };

    //@udpate username in database
    await User?.update(
      { username: newUsername },
      { where: { userId: req.user.userId } }
    );

    //@change the isVerified field to 0 so user need to verify their account again
    await User?.update(
      { isVerified: 0 },
      { where: { userId: req.user.userId } }
    );

    //@generate access token
    const accessToken = helpers.createToken({
      userId: req.user.userId,
      role: req.user.role,
    });

    //@get data email
    const email = userExists?.dataValues?.email;

    //@Send verification link via email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Verification Account",
      html: `<h1>Click <a href="http://localhost:5000/api/auth/verify/${accessToken}">here</a> to verify your account</h1>`,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Username changed", newUsername: newUsername });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@cahnge phone number constroller
export const changePhone = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get body from request
    const { currentPhone, newPhone } = req.body;
    await Validation.changePhoneSchema.validate(req.body);

    //@udpate phone in database
    await User?.update(
      { phone: newPhone },
      { where: { userId: req.user.userId } }
    );

    //@send response
    res.status(200).json({ message: "Phone changed", newPhone: newPhone });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@change email constroller
export const changeEmail = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get body from request
    const { currentEmail, newEmail } = req.body;
    await Validation.changeEmailSchema.validate(req.body);

    //@check if email exists
    const emailExist = await User?.findOne({
      where: { email: currentEmail, userId: req.user?.userId },
    });
    if (!emailExist) throw { status: 400, message: error.EMAIL_DOES_NOT_EXIS };

    //@check if new email is already exists
    const isNewEmailExist = await User?.findOne({
      where: { email: newEmail },
    });
    if (isNewEmailExist)
      throw { status: 400, message: error.EMAIL_ALREADY_EXISTS };

    //@udpate email in database and change isVerified to false
    await User?.update(
      { email: newEmail, isVerified: 0 },
      { where: { userId: req.user.userId } }
    );

    //@generate access token
    const accessToken = helpers.createToken({
      userId: req.user.userId,
      role: req.user.role,
    });

    //@Send verification link to new email
    const email = newEmail;
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Verification Account",
      html: `<h1>Click <a href="http://localhost:5000/api/auth/verify/${accessToken}">here</a> to verify your account</h1>`,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Email changed", newEmail: newEmail });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@change Password constroller
export const changePassword = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get body from request
    const { currentPassword, password, confirmPassword } = req.body;
    await Validation.changePasswordSchema.validate(req.body);

    const user = await User?.findOne({ where: { userId: req?.user.userId } });

    const isPasswordCorrect = encryption.comparePassword(
      currentPassword,
      user?.dataValues?.password
    );
    if (!isPasswordCorrect)
      throw { status: 400, message: error.INVALID_CREDENTIALS };

    //@has new password
    const encryptedPassword = helpers.hashPassword(password);

    //@udpate password in database and change isVerified to false
    await User?.update(
      { password: encryptedPassword, isVerified: 0 },
      { where: { userId: req.user.userId } }
    );

    //@generate access token
    const accessToken = helpers.createToken({
      userId: req.user.userId,
      role: req.user.role,
    });

    //@Send verification link to new email
    const { email } = await User?.findOne({
      where: { userId: req.user.userId },
    });
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Verification Account",
      html: `<h1>Click <a href="http://localhost:5000/api/auth/verify/${accessToken}">here</a> to verify your account</h1>`,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Password changed successfully" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

//@forget Password constroller
export const forgetPassword = async (req, res, next) => {
  try {
    //@get body from request
    const { email } = req.body;

    //@asume that email is uniqe
    const user = await User?.findOne({ where: { email: email } });
    if (!user) throw { status: 400, message: error.EMAIL_DOES_NOT_EXIS };

    //@generate access token
    const accessToken = helpers.createToken({
      userId: user.userId,
      role: user.role,
    });

    //@Send verification link to new email
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Reset Password",
      html: `<h1>Click <a href="http://localhost:5000/api/auth/forgetPassword/${accessToken}">here</a> to verify your account</h1>`,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    //@send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Please check your email" });
  } catch (error) {
    next(error);
  }
};

//@change Password constroller
export const ressetPassword = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    //@get body from request
    const { password, confirmPassword } = req.body;
    await Validation.ressetPassword.validate(req.body);

    //@asume front end send the request using header authorization
    //@the header authorization get from forget password url
    const token = req.headers.authorization?.split(" ")[1];
    const decodedToken = helpers.verifyToken(token);

    //@has new password
    const encryptedPassword = helpers.hashPassword(password);

    //@udpate password in database and isVerified set to 1
    await User?.update(
      { password: encryptedPassword, isVerified: 1 },
      { where: { userId: decodedToken?.userId } }
    );

    //@send response
    res
      .header("Authorization", `Bearer ${token}`)
      .status(200)
      .json({ message: "Password resset successfully" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};
