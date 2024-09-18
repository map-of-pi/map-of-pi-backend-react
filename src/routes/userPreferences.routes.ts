import { Router } from "express";

import * as userPreferencesController from "../controllers/userPreferencesController";
import { isUserSettingsFound } from "../middlewares/isUserSettingsFound";
import { verifyToken } from "../middlewares/verifyToken";
import upload from "../utils/multer";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreferencesSchema:
 *       type: object
 *       properties:
 *         user_settings_id:
 *           type: string
 *           description: Pi user ID
 *         user_name: 
 *           type: string
 *           description: Name of the user
 *         email:
 *           type: string
 *           description: Email address of the user
 *         phone_number:
 *           type: number
 *           description: Phone number of the user
 *         image:
 *           type: string
 *           description: Image of the user
 *         findme_preference:
 *           type: string
 *           description: FindMe preference of the user
 *         trust_meter_rating:
 *           $ref: '/api/docs/enum/TrustMeterScale.yml#/components/schemas/TrustMeterScale'
 *         search_map_center:
 *           type: object
 *           description: Geographical coordinates of the user's search center location
 *           properties:
 *             type:
 *               type: string
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *           required:
 *             - type
 *             - coordinates
 */
const userPreferencesRoutes = Router();

/**
 * @swagger
 * /api/v1/user-preferences/{user_settings_id}:
 *   get:
 *     tags:
 *       - User Preferences
 *     summary: Get the user preferences by user settings ID
 *     parameters:
 *       - name: user_settings_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the user preferences to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/GetUserPreferencesRs'
 *       404:
 *         description: User Preferences not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.get("/:user_settings_id", userPreferencesController.getUserPreferences);

/**
 * @swagger
 * /api/v1/user-preferences/me:
 *   post:
 *     tags:
 *       - User Preferences
 *     summary: Fetch the user's preference using Bearer Auth token *
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/GetUserPreferencesRs'
 *       404:
 *         description: User Preferences not found | User Settings not found
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.post(
  "/me", 
  verifyToken,
  isUserSettingsFound,
  userPreferencesController.fetchUserPreferences);

  /**
 * @swagger
 * /api/v1/user-preferences/add:
 *   put:
 *     tags:
 *       - User Preferences
 *     summary: Add new user preferences or update existing user preferences *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/AddUserPreferencesRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/AddUserPreferencesRs'
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.put(
  "/add",
  verifyToken,
  upload.single("image"),
  userPreferencesController.addUserPreferences
);

/**
 * @swagger
 * /api/v1/user-preferences/{user_settings_id}:
 *   delete:
 *     tags:
 *       - User Preferences
 *     summary: Delete user preferences by user settings ID *
 *     parameters:
 *       - name: user_settings_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the user preferences to delete
 *     responses:
 *       200:
 *         description: Successful response | User Preferences deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/DeleteUserPreferencesRs'
 *       404:
 *         description: User Preferences not found
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.delete(
  "/:user_settings_id",
  verifyToken,
  isUserSettingsFound,
  userPreferencesController.deleteUserPreferences
);

export default userPreferencesRoutes;
