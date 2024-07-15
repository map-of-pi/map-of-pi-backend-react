import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
import { isSellerOwner } from "../middlewares/isSellerOwner";
import { isSellerFound } from "../middlewares/isSellerFound";
import { verifyToken } from "../middlewares/verifyToken";
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
 *           $ref: '/api/docs/enum/TrustMeterScale.yml#/components/schemas/TrustMeterScale'
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
 * /api/v1/sellers/fetch:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Fetch all sellers within given coordinates and radius, or all sellers if coordinates and radius are not provided
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/GetAllSellersRq'
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
sellerRoutes.post("/fetch", sellerController.fetchSellersByLocation);

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
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.get("/:seller_id", isSellerFound, sellerController.getSingleSeller);

/**
 * @swagger
 * /api/v1/sellers/register:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Register a new seller *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterNewSellerRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterNewSellerRs'
 *       401:
 *         description: Unauthorized
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
 *   put:
 *     tags:
 *       - Seller
 *     summary: Update a seller *
 *     parameters:
 *       - name: seller_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the seller to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/UpdateSellerRq'
 *     responses:
 *       200:
 *         description: Successful reponse
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/UpdateSellerRs'
 *       404:
 *         description: Seller not found for update
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
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
