import multer from "multer";
import path from "path";

const storage = multer.diskStorage({ destination: "uploads/" });

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (
    !(extension === ".jpg" || extension === ".jpeg" || extension === ".png")
  ) {
    const error: any = {
      code: "INVALID_FILE_TYPE",
      message: "Wrong format for file",
    };
    cb(new Error(error.message));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;
