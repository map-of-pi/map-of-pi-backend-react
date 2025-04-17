import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as membershipController from "../controllers/membershipController";

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
 *         description: Successful response
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
membershipRoutes.get("/:membership_id", membershipController.getSingleMembership);

/**
 * @swagger
 * /api/v1/memberships/manage:
 *   put:
 *     tags:
 *       - Membership
 *     summary: Register a new membership or update existing membership *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/MembershipsSchema.yml#/components/schemas/ManageMembershipRq'
 *     responses:
 *       200:
 *         description: Successful response
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
  membershipController.manageMembership
);

export default membershipRoutes;