import { Router } from "express";

//@import controllers
import * as AuthControllers from "./index.js";

//@define route
const router = Router();
router.post("/register", AuthControllers.register);
router.post("/login", AuthControllers.login);
router.get("/verify/:token", AuthControllers.verifyAccount);

export default router;
