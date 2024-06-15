import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import { connectDB } from "./config/dbConnection";
import docRouter from "./docs/swagger";
import requestLogger from "./middlewares/logger";
import appRouter from "./routes";
import homeRoutes from "./routes/home.routes";
import userRoutes from "./routes/user.routes";
import sellerRoutes from "./routes/seller.routes";
import { env } from "./utils/env";

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(requestLogger);

app.use(cors({
    origin: "*"
}));

// Routes setup
app.use("/api/v1", appRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/", homeRoutes);
app.use("/", docRouter);

// DB setup
app.listen(env.PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${env.PORT}`);
  } catch (error: any) {
    console.log("Server failed to run", error.message);
  }
});
