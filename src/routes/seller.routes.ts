import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
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
 *         seller_type:
 *           type: string
 *           description: Type of the seller (active, inactive, test, other) // Update description here
 *           enum:
 *             - active
 *             - inactive
 *             - test
 *             - other
 *         image:
 *           type: string
 *           description: Image of the seller
 *         address:
 *           type: string
 *           description: Address of the seller
 *         average_rating:
 *           type: object
 *           description: Average rating of the seller
 *           properties:
 *             $numberDecimal:
 *               type: string
 *           required:
 *             - $numberDecimal
 *         sell_map_center:
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
 */
const sellerRoutes = Router();

/**
 * @swagger
 * /api/v1/sellers/fetch:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Fetch all sellers within given coordinates, radius, and search criteria, or all sellers if no parameters are not provided
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
 *       404:
 *         description: Sellers not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.post("/fetch", sellerController.fetchSellersByCriteria);

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
 *         description: The Pi UID of the seller to retrieve
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
sellerRoutes.get("/:seller_id", sellerController.getSingleSeller);

/**
 * @swagger
 * /api/v1/sellers/me:
 *   post:
 *     tags:
 *       - Seller
 *     summary: Fetch the user's seller registration using Bearer Auth token *
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/GetSellerRegistrationRs'
 *       404:
 *         description: Seller registration not found | Seller not found
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */  
sellerRoutes.post(
  "/me", 
  verifyToken,
  isSellerFound,
  sellerController.fetchSellerRegistration
);

/**
 * @swagger
 * /api/v1/sellers/register:
 *   put:
 *     tags:
 *       - Seller
 *     summary: Register a new seller or update existing seller *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterSellerRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/RegisterSellerRs'
 *       401:
 *         description: Unauthorized | Unauthorized user | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.put(
  "/register",
  verifyToken,
  upload.single("image"),
  sellerController.registerSeller
);

/**
 * @swagger
 * /api/v1/sellers/{seller_id}:
 *   delete:
 *     tags:
 *       - Seller
 *     summary: Delete a seller by seller ID *
 *     parameters:
 *       - name: seller_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the seller to delete
 *     responses:
 *       200:
 *         description: Successful response | Seller deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/SellersSchema.yml#/components/schemas/DeleteSellerRs'
 *       404:
 *         description: Seller not found
 *       401:
 *         description: Unauthorized | Authentication token is required | Authentication token is invalid or expired
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
sellerRoutes.delete(
  "/:seller_id",
  verifyToken,
  isSellerFound,
  sellerController.deleteSeller
);

export default sellerRoutes;
