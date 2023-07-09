import { Router } from "express";
import path from "path";
import { verifyUser } from "../../midlewares/token.verify.js";
import { createProfileUploader } from "../../helpers/uploader.js";

//@setup multer
const uploader = createProfileUploader(
  path.join(process.cwd(), "public", "images", "profiles")
);

//@import controllers
import * as ProfileController from "./index.js";

//@define route
const router = Router();
router.post(
  "/single-uploaded",
  verifyUser,
  uploader.single("file"),
  ProfileController.uploadImage
);

export default router;
