import { Router } from "express";
import * as getUserSettings from "../controllers/userPreferenceController";
import upload from "../utils/multer";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isSettingsOwner } from "../middlewares/isSettingsOwner";
import { isShopFound } from "../middlewares/isShopFound";

const reviewRoutes = Router();

reviewRoutes.post(
  "/add",
  isAuthenticated,
  upload.array("images"),
  getUserSettings.addUserSettings
);

reviewRoutes.get("/:id", getUserSettings.getUserSettings);

reviewRoutes.put(
  "/:id",
  isAuthenticated,
  isShopFound,
  isSettingsOwner,
  getUserSettings.updateUserSettings
);

reviewRoutes.delete(
  "/:id",
  isAuthenticated,
  isShopFound,
  isSettingsOwner,
  getUserSettings.deleteUserSettings
);

export default reviewRoutes;
