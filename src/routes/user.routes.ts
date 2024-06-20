import { Router } from "express";

import * as userController from "../controllers/userController";
import { verifyToken } from "../middlewares/verifyToken";

const userRoutes = Router();

userRoutes.post("/authenticate", userController.authenticateUser);
userRoutes.post("/signout", userController.signoutUser);
userRoutes.get("/me", verifyToken, );

export default userRoutes;
