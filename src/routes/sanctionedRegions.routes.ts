import {Router} from "express";
import { verifyAdminToken } from "../middlewares/verifyToken";
import * as sanctionedRegionsController from "../controllers/sanctionedRegionsController"

const sanctionedRegionsRoutes = Router();

/**
 * @swagger
 * /api/v1/reports/check-in-sanctioned-region:
 *   post:
 *     tags:
 *       - Report
 *     summary: Check if a point is within a sanctioned region
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -1.94995
 *               longitude:
 *                 type: number
 *                 example: 30.0588
 *     responses:
 *       200:
 *         description: Indicates whether the point is in a sanctioned region
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRestricted:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid coordinates provided
 *       500:
 *         description: Internal server error
 */
sanctionedRegionsRoutes.post(
  "/check-in-sanctioned-region",
  // verifyAdminToken,
  sanctionedRegionsController.checkIfPointInRegion
);

export default sanctionedRegionsRoutes;