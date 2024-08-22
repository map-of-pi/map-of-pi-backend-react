import { Router } from "express";

import * as userPreferencesController from "../controllers/userPreferencesController";
import { verifyToken } from "../middlewares/verifyToken";
import upload from "../utils/multer";
import { isUserSettingsFound } from "../middlewares/isUserSettingsFound";

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
 *         email:
 *           type: string
 *           description: Email address of the user
 *         phone_number:
 *           type: number
 *           description: Phone number of the user
 *         image:
 *           type: string
 *           description: Image of the user
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
 *       required:
 *         - user_settings_id
 */
const userPreferencesRoutes = Router();

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
 *         application/json:
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
  upload.array("images"),
  userPreferencesController.addUserPreferences
);

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

export default userPreferencesRoutes;
