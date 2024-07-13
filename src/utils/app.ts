import express from "express";
import bodyParser from "body-parser";
import cors from "cors"
import path from "path";

import docRouter from "../config/swagger";
import requestLogger from "../middlewares/logger";

import appRouter from "../routes";
import homeRoutes from "../routes/home.routes";
import userRoutes from "../routes/user.routes";
import userPreferencesRoutes from "../routes/userPreferences.routes";
import sellerRoutes from "../routes/seller.routes";
import reviewFeedbackRoutes from "../routes/reviewFeedback.routes";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(requestLogger);

app.use(cors({
    origin:"*"
}));

// serve static files for Swagger documentation
app.use('/api/docs', express.static(path.join(__dirname, '../config/docs')));
app.use('/api/docs/enum', express.static(path.join(__dirname, '../config/docs/enum')));
// Serve Swagger UI static files
app.use('/api/docs/swagger-ui', express.static(path.join(__dirname, '../node_modules/swagger-ui-dist')));

// Swagger OpenAPI documentation
app.use("/api/docs", docRouter);

app.use("/api/v1", appRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user-preferences", userPreferencesRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/review-feedback", reviewFeedbackRoutes);

app.use("/", homeRoutes);

export default app;