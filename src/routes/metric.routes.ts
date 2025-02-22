import { Router } from "express";
import { getTotalUserMetrics, getUserMetrics } from "../controllers/admin/metrics/userMetricsController";
import { getSellerMetrics } from "../controllers/admin/metrics/sellerMetricsController";
import { getReviewMetrics } from "../controllers/admin/metrics/reviewFeedbackMetricsController";
import { getRestrictedAreaMetrics } from "../controllers/admin/metrics/reportsMetricsController";

const metricRoutes = Router();

metricRoutes.get("/users",getTotalUserMetrics);
metricRoutes.get("/top-reviewer-stats", getUserMetrics);
metricRoutes.get("/sellers-stats", getSellerMetrics);
metricRoutes.get("/review-stats", getReviewMetrics);
metricRoutes.get("/banned-countries", getRestrictedAreaMetrics);

export default metricRoutes;
