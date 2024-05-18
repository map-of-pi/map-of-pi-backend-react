import { Router } from "express";
import * as shopController from "../controllers/shopController";
import upload from "../utils/multer";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isShopOwner } from "../middlewares/isShopOwner";
import { isShopFound } from "../middlewares/isShopFound";

const shopRoutes = Router();

shopRoutes.get("/", shopController.getAllShops);

shopRoutes.post(
  "/register",
  isAuthenticated,
  upload.array("images"),
  shopController.registerNewShop
);

shopRoutes.get("/:id", isShopFound, shopController.getSingleShop);

shopRoutes.put(
  "/:id",
  isAuthenticated,
  isShopFound,
  isShopOwner,
  shopController.updateShop
);

shopRoutes.delete(
  "/:id",
  isAuthenticated,
  isShopFound,
  isShopOwner,
  shopController.deleteShop
);

export default shopRoutes;
