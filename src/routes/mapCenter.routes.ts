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
 *         pi_uid:
 *           type: string
 *           description: Pi user ID
 *         latitude:
 *           type: string
 *           description: Latitude of the map center
 *         longitude:
 *           type: string
 *           description: Longitude of the map center
 *       required:
 *         - pi_uid
 *         - latitude
 *         - longitude
 */
const mapCenterRoutes = Router();

/**
 * @swagger
 * /api/v1/map-center/{pi_uid}:
 *   get:
 *     tags:
 *       - Map Center
 *     summary: Get the user's map center
 *     parameters:
 *       - name: pi_uid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi uid of the map center to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/MapCenterSchema.yml#/components/schemas/GetMapCenterRs'
 *       404:
 *         description: Map Center not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
mapCenterRoutes.get('/', verifyToken, mapCenterController.getMapCenter);

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
 *       401:
 *         description: Unauthorized
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
