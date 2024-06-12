import { Router } from "express";
import * as userController from "../controllers/userController";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const userRoutes = Router();

userRoutes.post("/authenticate", userController.authenticateUser);
userRoutes.post("/signout", userController.signoutUser);
userRoutes.post("/me", isAuthenticated);

export default userRoutes;
