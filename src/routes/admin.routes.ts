import { Router } from "express";
import { loginAdmin, registerAdmin, getAdminInfo, activateAdmin, deactivateAdmin } from "../controllers/admin/adminController";

const adminRoutes = Router();

adminRoutes.post("/login", loginAdmin);
adminRoutes.post("/register", registerAdmin);
adminRoutes.put("/deactivate/:id", deactivateAdmin);
adminRoutes.put("/activate/:id", activateAdmin);

adminRoutes.get("/me", getAdminInfo);

export default adminRoutes;