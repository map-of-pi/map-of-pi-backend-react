import {Router} from "express";
import * as reportController from "../controllers/reportsController";
import {verifyToken} from "../middlewares/verifyToken";

/**
 * @swagger
 * components:
 *   schemas:
 *     SanctionedSellerReport:
 *       type: object
 *       properties:
 *         report_id:
 *           type: string
 *           description: Unique identifier for the report.
 *         generated_at:
 *           type: string
 *           format: date-time
 *           description: Date and time the report was generated.
 *         status:
 *           type: string
 *           description: Current status of the report.
 *           enum:
 *             - pending
 *             - in_progress
 *             - completed
 *             - failed
 *         sanctioned_sellers:
 *           type: array
 *           description: List of sellers flagged in restricted regions.
 *           items:
 *             type: object
 *             properties:
 *               seller_id:
 *                 type: string
 *                 description: Pi user ID of the sanctioned seller.
 *               name:
 *                 type: string
 *                 description: Name of the sanctioned seller.
 *               location:
 *                 type: object
 *                 description: Location details of the seller.
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: Geographical coordinates (latitude and longitude).
 *                   location_name:
 *                     type: string
 *                     description: Name of the restricted area.
 *               violation_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date when the violation was detected.
 *       required:
 *         - report_id
 *         - generated_at
 *         - status
 *         - sanctioned_sellers
 */
const reportRoutes = Router();


/**
 * @swagger
 * /api/v1/sellers/sanctioned-sellers-report:
 *   get:
 *     tags:
 *       - Seller
 *     summary: Initiates report generation on Sanctioned Sellers, logs result to Sentry
 *     description: This endpoint triggers background processing of a sanctioned sellers report. Once triggered, a 200 response confirms initiation. The report will be available in Sentry upon completion.
 *     responses:
 *       200:
 *         description: Request accepted | Report generation started successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report generation started successfully. It will be available on Sentry upon completion."
 *       404:
 *         description: Not found | Endpoint does not exist
 *       401:
 *         description: Unauthorized | Invalid or expired authentication token
 *       400:
 *         description: Bad request | Invalid input
 *       500:
 *         description: Internal server error
 */
reportRoutes.get(
    "/sanctioned-sellers-report",
    verifyToken,
    reportController.getSanctionedSellersReport
);

export default reportRoutes;
