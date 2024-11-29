import {Router} from "express";
import * as reportController from "../controllers/reportsController";

const reportRoutes = Router();

/**
 * @swagger
 * /api/v1/reports/sanctioned-sellers-report:
 *   post:
 *     tags:
 *       - Report
 *     summary: Build a report for sellers in sanctioned regions.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/ReportsSchema.yml#/components/schemas/GetSanctionedSellersReportRs'
 *       500:
 *         description: Internal server error
 */
reportRoutes.post(
  "/sanctioned-sellers-report",
  reportController.getSanctionedSellersReport
);

export default reportRoutes;