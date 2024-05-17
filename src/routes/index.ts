import { Router } from "express";
import homeRoutes from "./home.routes";

const appRouter = Router();

appRouter.use("/", homeRoutes);

export default appRouter;
