import express from "express";
import bodyParser from "body-parser";
import cors from "cors"

import docRouter from "../docs/swagger";
import requestLogger from "../middlewares/logger";
import appRouter from "../routes";
import homeRoutes from "../routes/home.routes";
import userRoutes from "../routes/user.routes";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(requestLogger);

app.use(cors({
    origin:"*"
}))

app.use("/api/v1", appRouter);
app.use("/api/v1/user", userRoutes);
app.use("/", homeRoutes);
app.use("/", docRouter);

export default app;
