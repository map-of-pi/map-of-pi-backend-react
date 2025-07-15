import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as membershipController from "../controllers/membershipController"

const membershipRoutes = Router();

membershipRoutes.get("/", membershipController.getUserMembership);

// membershipRoutes.get(
//   "/:membership_id",
//   membershipController.getSingleMembership
// );

// membershipRoutes.put(
//   "/manage",
//   verifyToken,
//   membershipController.updateOrRenewMembership 
// );

export default membershipRoutes;