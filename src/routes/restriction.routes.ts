import {Router} from "express";
import * as restrictionController from "../controllers/admin/restrictionController";

const restrictionRoutes = Router();

/**
 * @swagger
 * /api/v1/restrictions/check-sanction-status:
 *   post:
 *     tags:
 *       - Restriction
 *     summary: Check if a [latitude, longitude] coordinate is within sanctioned boundaries.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -1.94995
 *               longitude:
 *                 type: number
 *                 example: 30.0588
 *             required:
 *               - latitude
 *               - longitude
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSanctioned:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
restrictionRoutes.post(
  "/check-sanction-status",
  restrictionController.checkSanctionStatus
);

export default restrictionRoutes;