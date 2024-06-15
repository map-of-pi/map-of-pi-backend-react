import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
import { verifyToken } from "../middlewares/verifyToken";
import { isShopOwner } from "../middlewares/isShopOwner";
import { isSellerFound } from "../middlewares/isSellerFound";
import upload from "../utils/multer";

const sellerRoutes = Router();

sellerRoutes.get("/", sellerController.getAllSellers);

sellerRoutes.post(
  "/register",
  verifyToken,
  upload.array("images"),
  sellerController.registerNewSeller
);

sellerRoutes.get("/:seller_id", isSellerFound, sellerController.getSingleSeller);

sellerRoutes.put(
  "/:id",
  verifyToken,
  isSellerFound,
  isShopOwner,
  sellerController.updateSeller
);

export default sellerRoutes;
