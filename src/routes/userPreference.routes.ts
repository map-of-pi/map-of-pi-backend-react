import { Router } from "express";

import * as userPreferenceController from "../controllers/userPreferenceController";
import { verifyToken } from "../middlewares/verifyToken";

import upload from "../utils/multer";

const userPreferenceRoutes = Router();

userPreferenceRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  userPreferenceController.addUserPreference
);

userPreferenceRoutes.get("/:user_settings_id", userPreferenceController.getUserPreference);

userPreferenceRoutes.put(
  "/:user_settings_id",
  verifyToken,
  userPreferenceController.updateUserPreference
);

export default userPreferenceRoutes;
