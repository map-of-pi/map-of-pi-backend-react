import mongoose, { Schema } from "mongoose";
import { IA2UJob } from "../types";

const A2UPaymentQueueSchema = new Schema<IA2UJob>(
  {
    sellerPiUid: { type: String, required: true },
    amount: { type: Number, required: true },
    xRef_ids: [{ type: String, required: true }],
    memo: { type: String, require: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'batching'],
      default: 'pending',
    },
    last_a2u_date: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    last_error: { type: String, default: null }
  },
  { timestamps: true }
);

const A2UPaymentQueue = mongoose.model<IA2UJob>('A2UPaymentQueue', A2UPaymentQueueSchema);
export default A2UPaymentQueue;