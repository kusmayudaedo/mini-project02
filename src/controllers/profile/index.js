import User from "../../models/user.js";

//@Upload user profile
export const uploadImage = async (req, res, next) => {
  try {
    // @check if image is uploaded
    if (!req.file) {
      throw new { status: 400, message: "Please upload an image." }();
    }

    const imageUrl = "public/images/profiles/" + req?.file?.filename;

    // @update the user profile
    await User?.update(
      { imgProfile: imageUrl },
      { where: { userId: req.user.userId } }
    );

    // @send response
    res.status(200).json({
      message: "Image uploaded successfully.",
      userId: req.user?.userId,
      imageUrl: imageUrl,
    });
  } catch (error) {
    next(error);
  }
};
