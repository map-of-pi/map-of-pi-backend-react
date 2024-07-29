import { Router } from "express";

import * as userController from "../controllers/userController";
import { verifyToken } from "../middlewares/verifyToken";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSchema:
 *       type: object
 *       properties:
 *         pi_uid:
 *           type: string
 *           description: Pi user ID
 *         pi_username:
 *           type: string
 *           description: Pi user alias
 *         user_name:
 *           type: string
 *           description: Name of Pi user; preset to Pi user alias
 *       required:
 *         - pi_uid
 *         - pi_username
 *         - user_name
 */
const userRoutes = Router();

/**
 * @swagger
 * /api/v1/users/authenticate:
 *   post:
 *     tags:
 *       - User
 *     summary: Authenticate existing user or build new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/UsersSchema.yml#/components/schemas/AuthenticateUserRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UsersSchema.yml#/components/schemas/AuthenticateUserRs'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userRoutes.post("/authenticate", userController.authenticateUser);

userRoutes.post("/signout", userController.signoutUser);
userRoutes.get("/me", verifyToken, userController.autoLoginUser); 

/**
 * @swagger
 * /api/v1/users/{pi_uid}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get a user by Pi UID
 *     parameters:
 *       - name: pi_uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi uid of the user to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UsersSchema.yml#/components/schemas/GetUserRs'
 *       404:
 *         description: User not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userRoutes.get("/:pi_uid", userController.getUser);

/**
 * @swagger
 * /api/v1/users/{pi_uid}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a user and user associated data by Pi UID *
 *     parameters:
 *       - name: pi_uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the user to delete
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/UsersSchema.yml#/components/schemas/DeleteUserRs'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
userRoutes.delete(
  "/:pi_uid",
  verifyToken,
  userController.deleteUser
);

export default userRoutes;
