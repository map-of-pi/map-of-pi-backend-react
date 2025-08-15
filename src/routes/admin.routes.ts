import { Router } from "express";
import { activateAdmin, deactivateAdmin, getAdminInfo, getAlladmins, loginAdmin, registerAdmin } from "../controllers/admin";




const adminRoutes = Router();

adminRoutes.get("/me", getAdminInfo);
adminRoutes.post("/register", registerAdmin);
adminRoutes.post("/login", loginAdmin);
adminRoutes.put("/deactivate/:id", deactivateAdmin);
adminRoutes.put("/activate/:id", activateAdmin);

export default adminRoutes;
