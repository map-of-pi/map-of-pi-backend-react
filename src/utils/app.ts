import express from "express";
import cookieParser from 'cookie-parser';
import cors from "cors"
import dotenv from "dotenv";
import path from "path";

import docRouter from "../config/swagger";
import requestLogger from "../middlewares/logger";

import appRouter from "../routes";
import homeRoutes from "../routes/home.routes";
import userRoutes from "../routes/user.routes";
import userPreferencesRoutes from "../routes/userPreferences.routes";
import membershipRoutes from "../routes/membership.routes";
import sellerRoutes from "../routes/seller.routes";
import reviewFeedbackRoutes from "../routes/reviewFeedback.routes";
import mapCenterRoutes from "../routes/mapCenter.routes";
import transactionRoutes from "../routes/transaction.routes";
import reportRoutes from "../routes/report.routes";
import toggleRoutes from "../routes/toggle.routes";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);

app.use(cors({
    origin: process.env.CORS_ORIGIN_URL,
    credentials: true
}));
app.use(cookieParser());

// serve static files for Swagger documentation
app.use('/api/docs', express.static(path.join(__dirname, '../config/docs')));

// Swagger OpenAPI documentation
app.use("/api/docs", docRouter);

app.use("/api/v1", appRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user-preferences", userPreferencesRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/review-feedback", reviewFeedbackRoutes);
app.use("/api/v1/map-center", mapCenterRoutes);
app.use("/api/v1/memberships", membershipRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/toggles", toggleRoutes);

app.use("/", homeRoutes);

export default app;
