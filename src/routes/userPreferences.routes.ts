import { Router } from "express";

import * as userPreferencesController from "../controllers/userPreferencesController";
import { verifyToken } from "../middlewares/verifyToken";

import upload from "../utils/multer";

const userPreferencesRoutes = Router();

userPreferencesRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  userPreferencesController.addUserPreferences
);

userPreferencesRoutes.get("/:user_settings_id", userPreferencesController.getUserPreferences);

userPreferencesRoutes.put(
  "/:user_settings_id",
  verifyToken,
  userPreferencesController.updateUserPreferences
);

export default userPreferencesRoutes;
