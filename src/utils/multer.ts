import multer from "multer";
import path from "path";
import fs from "fs";

import { env } from "./env";

// ensure the directory exists
const uploadPath = path.join(__dirname, env.UPLOAD_PATH);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!(extension === ".jpg" || extension === ".jpeg" || extension === ".png")) {
    const error: any = {
      code: "INVALID_FILE_TYPE",
      message: "Wrong format | Please upload an image with one of the following formats: .jpg, .jpeg, or .png.",
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
