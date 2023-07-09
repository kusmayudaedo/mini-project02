import { Router } from "express";
import { verifyUser } from "../../midlewares/token.verify.js";

//@import controllers
import * as AuthControllers from "./index.js";

//@define route
const router = Router();
router.post("/register", AuthControllers.register);
router.post("/login", AuthControllers.login);
router.get("/", AuthControllers.keepLogin);
router.get("/verify/:token", AuthControllers.verifyAccount);
router.patch("/changeUsername", verifyUser, AuthControllers.changeUsername);
router.patch("/changePhone", verifyUser, AuthControllers.changePhone);
router.patch("/changeEmail", verifyUser, AuthControllers.changeEmail);
router.patch("/changePassword", verifyUser, AuthControllers.changePassword);
router.put("/forgetPassword", AuthControllers.forgetPassword);
router.patch("/ressetPassword", AuthControllers.ressetPassword);

export default router;
