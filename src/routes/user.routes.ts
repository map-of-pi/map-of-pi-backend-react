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
 *         uid:
 *           type: string
 *           description: Pi user ID
 *         username:
 *           type: string
 *           description: Name of Pi user; preset to Pi user ID
 *       required:
 *         - uid
 *         - username
 */
const userRoutes = Router();

/**
 * @swagger
 * /api/v1/users/authenticate:
 *   post:
 *     tags:
 *       - User
 *     summary: Authenticate User
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
 * /api/v1/users/{uid}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get a user by UID
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The UID of the user to retrieve
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
userRoutes.get("/:uid", userController.getUser);

export default userRoutes;
