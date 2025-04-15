import mongoose, { Schema } from "mongoose";
import { IPayment } from "../types";

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pi_payment_id: {
      type: String,
      required: true,
      unique: true,
    },
    txid: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      required: true,
      default: false,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    memo: {
      type: String,
      default: "",
    },
    payment_type: {
      type: String,
      enum: ["Membership Upgrade", "Buyer Checkout"],
      required: true,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
