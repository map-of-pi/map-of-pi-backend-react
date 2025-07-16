import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as membershipController from "../controllers/membershipController";

const membershipRoutes = Router();

membershipRoutes.get("/", verifyToken, membershipController.getUserMembership)

export default membershipRoutes;