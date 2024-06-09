import express from "express";
import cors from "cors"
import bodyParser from "body-parser";

import appRouter from "../routes";
import docRouter from "../docs/swagger";
import loggerMiddleware from "../middlewares/logger";
import homeRoutes from "../routes/home.routes";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

app.use(loggerMiddleware)

app.use(cors({
    origin:"*"
}))

app.use("/", homeRoutes);

app.use("/api/v1", appRouter);
app.use("/", docRouter);

export default app;
