import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { completePayment } from "../controllers/paymentController";

const router = express.Router();

router.post("/complete", verifyToken, completePayment);

export default router;