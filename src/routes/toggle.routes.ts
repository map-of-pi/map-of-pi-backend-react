import { Router } from "express";

import * as toggleController from "../controllers/admin/toggleController";

/**
 * @swagger
 * components:
 *   schemas:
 *     ToggleSchema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the toggle
 *         enabled:
 *           type: boolean
 *           description: State of the toggle
 *         description:
 *           type: string
 *           description: Description of the toggle
 */
const toggleRoutes = Router();

/**
 * @swagger
 * /api/v1/toggles:
 *   get:
 *     tags:
 *       - Toggle
 *     summary: Get all existing toggles
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/TogglesSchema.yml#/components/schemas/GetAllTogglesRs'
 *       500:
 *         description: Internal server error
 */
toggleRoutes.get("/", toggleController.getToggles);

/**
 * @swagger
 * /api/v1/toggles/{toggle_name}:
 *   get:
 *     tags:
 *       - Toggle
 *     summary: Get the corresponding toggle by toggle name
 *     parameters:
 *       - name: toggle_name
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the seller to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/TogglesSchema.yml#/components/schemas/GetSingleToggleRs'
 *       404:
 *         description: Toggle not found
 *       500:
 *         description: Internal server error
 */
toggleRoutes.get("/:toggle_name", toggleController.getToggle);

/**
 * @swagger
 * /api/v1/toggles/add:
 *   post:
 *     tags:
 *       - Toggle
 *     summary: Add a new toggle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/TogglesSchema.yml#/components/schemas/AddToggleRq'
 *     responses:
 *       201:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '/api/docs/TogglesSchema.yml#/components/schemas/AddToggleRs'
 *       500:
 *         description: Internal server error
 */
toggleRoutes.post("/add", toggleController.addToggle);

/**
 * @swagger
 * /api/v1/toggles/update:
 *   put:
 *     tags:
 *       - Toggle
 *     summary: Update an existing toggle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/TogglesSchema.yml#/components/schemas/UpdateToggleRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '/api/docs/TogglesSchema.yml#/components/schemas/UpdateToggleRs'
 *       500:
 *         description: Internal server error
 */
toggleRoutes.put("/update", toggleController.updateToggle);

export default toggleRoutes;
