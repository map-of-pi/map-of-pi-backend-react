import { Router } from "express";
import * as sellerController from "../controllers/sellerController";
import upload from "../utils/multer";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isShopOwner } from "../middlewares/isShopOwner";
import { isShopFound } from "../middlewares/isShopFound";

const sellerRoutes = Router();

sellerRoutes.get("/", sellerController.getAllSellers);

sellerRoutes.post(
  "/register",
  isAuthenticated,
  upload.array("images"),
  sellerController.registerNewSeller
);

sellerRoutes.get("/:id", isShopFound, sellerController.getSingleSeller);

sellerRoutes.put(
  "/:id",
  isAuthenticated,
  isShopFound,
  isShopOwner,
  sellerController.updateSeller
);

sellerRoutes.delete(
  "/:id",
  isAuthenticated,
  isShopFound,
  isShopOwner,
  sellerController.deleteSeller
);

export default sellerRoutes;
