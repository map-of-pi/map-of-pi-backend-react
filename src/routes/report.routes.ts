import {Router} from "express";
import * as reportController from "../controllers/reportsController";

const reportRoutes = Router();

reportRoutes.post(
    "/sanctioned-sellers-report",
    reportController.getSanctionedSellersReport
);

export default reportRoutes;
