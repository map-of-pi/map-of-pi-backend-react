import { Router } from "express";
import { getAllTiers, getTierByClass } from "../controllers/tierController";
import { verifyToken } from "../middlewares/verifyToken";

/**
 * @swagger
 * /api/v1/tiers:
 *   get:
 *     tags:
 *       - Tiers
 *     summary: Get all membership tiers
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tier'
 *       500:
 *         description: Internal server error
 */
const tierRoutes = Router();

// Endpoint to get all tiers
tierRoutes.get("/tiers", verifyToken, getAllTiers);

/**
 * @swagger
 * /api/v1/tiers/{membershipClass}:
 *   get:
 *     tags:
 *       - Tiers
 *     summary: Get a tier by membership class
 *     parameters:
 *       - name: membershipClass
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership class to fetch details for
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tier'
 *       404:
 *         description: Tier not found
 *       500:
 *         description: Internal server error
 */
tierRoutes.get("/tiers/:membershipClass", verifyToken, getTierByClass);

export default tierRoutes;