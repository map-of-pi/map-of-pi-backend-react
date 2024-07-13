import { Router } from "express";

import * as userPreferencesController from "../controllers/userPreferencesController";
import { isUserSettingsOwner } from "../middlewares/isUserSettingsOwner";
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
 *   post:
 *     tags:
 *       - User Preferences
 *     summary: Add new user preferences *
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
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.post(
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
 *         description: The ID of the user preferences to retrieve
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
 * /api/v1/user-preferences/{user_settings_id}:
 *   put:
 *     tags:
 *       - User Preferences
 *     summary: Update the user preferences *
 *     parameters:
 *       - name: user_settings_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/UpdateUserPreferencesRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UserPreferencesSchema.yml#/components/schemas/UpdateUserPreferencesRs'
 *       404:
 *         description: User Preferences not found for update
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userPreferencesRoutes.put(
  "/:user_settings_id",
  verifyToken,
  isUserSettingsFound,
  isUserSettingsOwner,
  userPreferencesController.updateUserPreferences
);

export default userPreferencesRoutes;
