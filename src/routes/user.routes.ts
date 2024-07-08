import { Router } from "express";

import * as userController from "../controllers/userController";
import { verifyToken } from "../middlewares/verifyToken";

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
 *             $ref: '#/components/schemas/AuthenticateUserRq'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthenticateUserRs'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
userRoutes.post("/authenticate", userController.authenticateUser);

userRoutes.post("/signout", userController.signoutUser);
userRoutes.get("/me", verifyToken, userController.autoLoginUser);

export default userRoutes;
