import { Router } from "express";

import * as getUserSettings from "../controllers/userPreferenceController";
import { verifyToken } from "../middlewares/verifyToken";
import { isSettingsOwner } from "../middlewares/isSettingsOwner";
import { isSellerFound } from "../middlewares/isSellerFound";
import upload from "../utils/multer";

const reviewRoutes = Router();

reviewRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  getUserSettings.addUserSettings
);

reviewRoutes.get("/:id", getUserSettings.getUserSettings);

reviewRoutes.put(
  "/:id",
  verifyToken,
  isSellerFound,
  isSettingsOwner,
  getUserSettings.updateUserSettings
);

reviewRoutes.delete(
  "/:id",
  verifyToken,
  isSellerFound,
  isSettingsOwner,
  getUserSettings.deleteUserSettings
);

export default reviewRoutes;
