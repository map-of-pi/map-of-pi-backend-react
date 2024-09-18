import multer from "multer";
import path from "path";
import fs from "fs";

import { env } from "./env";

// define the storage configuration but delay directory creation until needed
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('/tmp', env.UPLOAD_PATH); // Use `/tmp` for serverless environments i.e., Vercel

    // ensure the directory exists at runtime
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

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
