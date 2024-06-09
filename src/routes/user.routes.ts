import { Router } from "express";
import * as userController from "../controllers/userController";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { verifyAccessToken } from "../middlewares/verifyAccessToken";
import { verifyToken } from "../middlewares/verifyToken";

const userRoutes = Router();

userRoutes.post("/authenticate",
  // verifyAccessToken,
  userController.authenticateUser);
userRoutes.post("/signout", userController.signoutUser);
userRoutes.get("/me", verifyToken);

export default userRoutes;
