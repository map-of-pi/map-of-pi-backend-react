import {Router} from "express";
import * as reportController from "../controllers/admin/reportsController";
import { verifyAdminToken } from "../middlewares/verifyToken";

const reportRoutes = Router();

/**
 * @swagger
 * /api/v1/reports/sanctioned-sellers-report:
 *   post:
 *     tags:
 *       - Report
 *     summary: Gather and build a report for sellers in sanctioned regions *
 *     security:
 *       - AdminPasswordAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/ReportsSchema.yml#/components/schemas/GetSanctionedSellersReportRs'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
reportRoutes.post(
  "/sanctioned-sellers-report",
  verifyAdminToken,
  reportController.getSanctionedSellersReport
);

export default reportRoutes;
