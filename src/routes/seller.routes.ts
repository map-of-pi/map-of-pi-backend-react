import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
import { verifyToken } from "../middlewares/verifyToken";
import { isSellerOwner } from "../middlewares/isSellerOwner";
import { isSellerFound } from "../middlewares/isSellerFound";
import upload from "../utils/multer";

/**
 * @swagger
 * components:
 *   schemas:
 *     SellerSchema:
 *       type: object
 *       properties:
 *         seller_id:
 *           type: string
 *           description: Pi user ID of the seller
 *         name:
 *           type: string
 *           description: Name of the seller
 *         description:
 *           type: string
 *           description: Description of the seller
 *         image:
 *           type: string
 *           description: Image of the seller
 *         address:
 *           type: string
 *           description: Address of the seller
 *         sale_items:
 *           type: string
 *           description: Sale items/descriptions offered by the seller
 *         average_rating:
 *           type: object
 *           description: Average rating of the seller
 *           properties:
 *             $numberDecimal:
 *               type: string
 *           required:
 *             - $numberDecimal
 *         trust_meter_rating:
 *           type: object
 *           $ref: '#/components/schemas/TrustMeterScale'
 *         coordinates:
 *           type: object
 *           description: Geographical coordinates of the seller's location
 *           properties:
 *             type:
 *               type: string
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *           required:
 *             - type
 *             - coordinates
 *         order_online_enabled_pref:
 *           type: boolean
 *           description: Preference for online ordering availability
 *       required:
 *         - seller_id
 *         - name
 *         - description
 *         - average_rating
 *         - trust_meter_rating
 *         - order_online_enabled_pref
 */
const sellerRoutes = Router();

/**
 * @swagger
 * /api/v1/sellers:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get all sellers
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/SellersSchema.yml#/components/schemas/GetAllSellersRs'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.get("/", sellerController.getAllSellers);

/**
 * @swagger
 * /api/v1/sellers/register:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Register a new seller
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterNewSellerRq'
 *     responses:
 *       200:
 *         description: Seller registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterNewSellerRs'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.post(
  "/register",
  verifyToken,
  upload.array("images"),
  sellerController.registerNewSeller
);

/**
 * @swagger
 * /api/v1/sellers/{seller_id}:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Get a single seller by seller ID
 *     parameters:
 *       - name: seller_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/GetSingleSellerRs'
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
sellerRoutes.get("/:seller_id", isSellerFound, sellerController.getSingleSeller);

/**
 * @swagger
 * /api/v1/sellers/{seller_id}:
 *   put:
 *     tags:
 *       - Seller
 *     summary: Update a seller
 *     parameters:
 *       - name: seller_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller to update
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/UpdateSellerRq'
 *     responses:
 *       200:
 *         description: Successful update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/UpdateSellerRs'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Internal server error
 */
sellerRoutes.put(
  "/:seller_id",
  verifyToken,
  isSellerFound,
  isSellerOwner,
  sellerController.updateSeller
);

export default sellerRoutes;
