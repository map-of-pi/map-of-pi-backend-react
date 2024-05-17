import mongoose, { Schema, Types } from "mongoose";
import { IPayment } from "../types";

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    piTransactionId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
