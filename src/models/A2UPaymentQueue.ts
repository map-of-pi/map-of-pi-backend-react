import mongoose, { Schema } from "mongoose";
import { A2UPaymentQueue } from "../types";

export const A2U_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  BATCHING: "batching",
};

export type A2UStatus = typeof A2U_STATUS[keyof typeof A2U_STATUS];

const A2UPaymentQueueSchema = new Schema<A2UPaymentQueue>(
  {
    sellerPiUid: { type: String, required: true },
    amount: { type: Number, required: true },
    xRef_ids: [{ type: String, required: true }],
    memo: { type: String, require: true },
    status: {
      type: String,
      enum: Object.values(A2U_STATUS),
      default: A2U_STATUS.PENDING,
    },
    last_a2u_date: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    last_error: { type: String, default: null }
  },
  { timestamps: true }
);

const A2UPaymentQueue = mongoose.model<A2UPaymentQueue>('A2UPaymentQueue', A2UPaymentQueueSchema);

export default A2UPaymentQueue;