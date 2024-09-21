import { Router } from 'express';
import * as mapCenterController from '../controllers/mapCenterController';
import { verifyToken } from '../middlewares/verifyToken';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapCenterSchema:
 *       type: object
 *       properties:
 *         map_center_id:
 *           type: string
 *           description: Pi user ID
 *         latitude:
 *           type: string
 *           description: Latitude of the map center
 *         longitude:
 *           type: string
 *           description: Longitude of the map center
 */
const mapCenterRoutes = Router();

/**
 * @swagger
 * /api/v1/map-center:
 *   get:
 *     tags:
 *       - Map Center
 *     summary: Get the user's map center *
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/MapCenterSchema.yml#/components/schemas/GetMapCenterRs'
 *       404:
 *         description: Map Center not found | User not found
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired    
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
mapCenterRoutes.get(
  '/', 
  verifyToken, 
  mapCenterController.getMapCenter
);

/**
 * @swagger
 * /api/v1/map-center/save:
 *   put:
 *     tags:
 *       - Map Center
 *     summary: Save a new map center or update existing map center *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/MapCenterSchema.yml#/components/schemas/SaveMapCenterRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/MapCenterSchema.yml#/components/schemas/SaveMapCenterRs'
 *       404:
 *         description: User not found; Map Center failed to save
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
mapCenterRoutes.put(
  '/save', 
  verifyToken, 
  mapCenterController.saveMapCenter
);

export default mapCenterRoutes;
