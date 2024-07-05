import express from "express";
import cors from "cors";
import dotenv from 'dotenv';

import docRouter from "../docs/swagger";
import requestLogger from "../middlewares/logger";
import appRouter from "../routes";
import homeRoutes from "../routes/home.routes";
import userRoutes from "../routes/user.routes";
import userPreferencesRoutes from "../routes/userPreferences.routes";
import sellerRoutes from "../routes/seller.routes";
import reviewFeedbackRoutes from "../routes/reviewFeedback.routes";

dotenv.config();

const app = express();

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data
app.use(express.json());

// Middleware for logging requests
app.use(requestLogger);

// Middleware to enable CORS
app.use(cors({
  origin: "*"
}));

// Main application routes
app.use("/api/v1", appRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user-preferences", userPreferencesRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/review-feedback", reviewFeedbackRoutes);

// Swagger OpenAPI documentation route
app.use("/api/docs", docRouter);

// Home route
app.use("/", homeRoutes);

export default app;
