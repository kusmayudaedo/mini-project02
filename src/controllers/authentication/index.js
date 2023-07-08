import User from "../../models/user.js";
import { ValidationError } from "yup";
import { hashPassword, comparePassword } from "../../helpers/encryption.js";
import { createToken, verifyToken } from "../../helpers/token.js";
import * as Validation from "./validation.js";
import transporter from "../../helpers/transporter.js";
import * as config from "../../config/index.js";
import {
  USER_ALREADY_EXISTS,
  USER_DOES_NOT_EXISTS,
  INVALID_CREDENTIALS,
  USER_UNVERIFIED,
} from "../../midlewares/error.handler.js";

//@register constroller
export const register = async (req, res, next) => {
  try {
    const { username, email, phone, password } = req.body;
    await Validation.RegisterValidationSchema.validate(req.body);

    //@check if user is already registered
    const userExists = await User?.findOne({ where: { username, email } });
    if (userExists) throw { status: 400, message: USER_ALREADY_EXISTS };

    //@encrypt user password using bcrypt
    const encryptedPassword = hashPassword(password);
    const user = await User.create({
      username,
      email,
      phone,
      password: encryptedPassword,
    });

    //@delete data password before sending response
    delete user?.dataValues?.password;

    //@generate access token
    const accessToken = createToken({
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

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });
  } catch (error) {
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
    if (!userExists) throw { status: 400, message: USER_DOES_NOT_EXISTS };

    //@check password
    const isPasswordCorrect = comparePassword(
      password,
      userExists?.dataValues?.password
    );
    if (!isPasswordCorrect) throw { status: 400, message: INVALID_CREDENTIALS };

    //@check if user verified
    if (userExists?.dataValues?.isVerified === 0)
      throw { status: 400, message: USER_UNVERIFIED };

    //@generate access token
    const accessToken = createToken({
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

//@verify account
export const verifyAccount = async (req, res, next) => {
  try {
    //@get token params
    const { token } = req.params;

    //@verify the token
    const decodedToken = verifyToken(token);

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
