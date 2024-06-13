import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
import { verifyToken } from "../middlewares/verifyToken";
import { isShopOwner } from "../middlewares/isShopOwner";
import { isShopFound } from "../middlewares/isShopFound";
import upload from "../utils/multer";

const sellerRoutes = Router();

sellerRoutes.get("/", sellerController.getAllSellers);

sellerRoutes.post(
  "/register",
  verifyToken,
  upload.array("images"),
  sellerController.registerNewSeller
);

sellerRoutes.get("/:id", isShopFound, sellerController.getSingleSeller);

sellerRoutes.put(
  "/:id",
  verifyToken,
  isShopFound,
  isShopOwner,
  sellerController.updateSeller
);

sellerRoutes.delete(
  "/:id",
  verifyToken,
  isShopFound,
  isShopOwner,
  sellerController.deleteSeller
);

export default sellerRoutes;
