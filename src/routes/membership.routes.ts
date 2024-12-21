import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as membershipController from "../controllers/membershipController";

const membershipRoutes = express.Router();

/**
 * @swagger
 * /api/v1/membership/membership-status/{user_id}:
 *   get:
 *     tags:
 *       - Membership
 *     summary: Fetch membership status by user ID
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user record
 *     responses:
 *       200:
 *         description: Membership status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 membership_class:
 *                   type: string
 *                 mappi_balance:
 *                   type: number
 *                 membership_expiration:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Membership not found
 *       500:
 *         description: Internal server error
 */
membershipRoutes.get(
  "/membership-status/:user_id",
  verifyToken,
  membershipController.getMembershipStatus
);

/**
 * @swagger
 * /api/v1/membership/upgrade-membership:
 *   post:
 *     tags:
 *       - Membership
 *     summary: Upgrade the user's membership
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               newMembershipClass:
 *                 type: string
 *               mappiAllowance:
 *                 type: number
 *               durationWeeks:
 *                 type: number
 *     responses:
 *       200:
 *         description: Membership upgraded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 membership_class:
 *                   type: string
 *                 mappi_balance:
 *                   type: number
 *                 membership_expiration:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Membership not found
 *       500:
 *         description: Internal server error
 */
membershipRoutes.post(
  "/upgrade-membership",
  verifyToken,
  membershipController.upgradeMembership
);

/**
 * @swagger
 * /api/v1/membership/use-mappi:
 *   post:
 *     tags:
 *       - Membership
 *     summary: Deduct a mappi from the user's balance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mappi deducted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mappi_balance:
 *                   type: number
 *       400:
 *         description: Insufficient mappi balance
 *       404:
 *         description: Membership not found
 *       500:
 *         description: Internal server error
 */
membershipRoutes.post(
  "/use-mappi",
  verifyToken,
  membershipController.useMappi
);

export default membershipRoutes;
