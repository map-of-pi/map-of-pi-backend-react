import express from "express";
import cors from "cors";

import docRouter from "../docs/swagger";
import requestLogger from "../middlewares/logger";

import appRouter from "../routes";
import homeRoutes from "../routes/home.routes";
import userRoutes from "../routes/user.routes";
import userPreferencesRoutes from "../routes/userPreferences.routes";
import sellerRoutes from "../routes/seller.routes"; // Ensure this path is correct
import reviewFeedbackRoutes from "../routes/reviewFeedback.routes";

import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);

app.use(cors({
    origin: "*"
}));

app.use("/api/v1", appRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user-preferences", userPreferencesRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/review-feedback", reviewFeedbackRoutes);

// Swagger OpenAPI documentation
app.use("/api/docs", docRouter);

app.use("/", homeRoutes);

export default app;
