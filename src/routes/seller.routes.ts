import { Router } from "express";

import * as sellerController from "../controllers/sellerController";
import { verifyToken } from "../middlewares/verifyToken";
import { isSellerOwner } from "../middlewares/isSellerOwner";
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
  "/:seller_id",
  verifyToken,
  isSellerFound,
  isSellerOwner,
  sellerController.updateSeller
);

export default sellerRoutes;
