import { Router } from "express";
import homeRoutes from "./home.route";


const appRouter = Router()

appRouter.use("/", homeRoutes)


export default appRouter;