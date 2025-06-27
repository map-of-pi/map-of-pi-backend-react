import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as membershipLegacyController from "../controllers/membershipLegacy.controller";
import * as membershipController from "../controllers/membershipController"

const membershipRoutes = express.Router();

/**
 * @swagger
 * /api/v1/memberships/{membership_id}:
 *   get:
 *     tags:
 *       - Membership
 *     summary: Get a single membership by membership ID
 *     parameters:
 *       - name: membership_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the membership to retrieve
 *     responses:
 *       200:
 *         description: Membership retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/MembershipsSchema.yml#/components/schemas/GetSingleMembershipRs'
 *       404:
 *         description: Membership not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
membershipRoutes.get(
  "/:membership_id",
  membershipController.getSingleMembership
);

/**
 * @swagger
 * /api/v1/memberships/manage:
 *   put:
 *     tags:
 *       - Membership
 *     summary: Register or update membership (non-payment flow) Legacy
 *     description: Legacy endpoint — production upgrades must go through Pi payment flow (U2A).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/MembershipsSchema.yml#/components/schemas/ManageMembershipRq'
 *     responses:
 *       200:
 *         description: Membership registered or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/MembershipsSchema.yml#/components/schemas/ManageMembershipRs'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
membershipRoutes.put(
  "/manage",
  verifyToken,
  membershipController.updateOrRenewMembership 
);

export default membershipRoutes;