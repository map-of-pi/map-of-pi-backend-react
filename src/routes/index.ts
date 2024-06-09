import { Router } from "express";
import homeRoutes from "./home.routes";
import userRoutes from "./user.routes";

const appRouter = Router();

appRouter.use("/users", userRoutes);
appRouter.use("/", homeRoutes);

export default appRouter;
