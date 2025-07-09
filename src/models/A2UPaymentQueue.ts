import mongoose, { Schema, Types } from "mongoose";
import { A2UPaymentStatus } from "./enums/a2uPaymentStatus";
import { A2UPaymentQueue } from "../types";

const A2UPaymentQueueSchema = new Schema<A2UPaymentQueue>(
  {
    payee_pi_uid: { 
      type: String, 
      required: true 
    },
    xref_ids: [
      { 
        type: String, 
        required: true 
      }
    ],
    amount: {
      type: Number, 
      required: true 
    },
    memo: { 
      type: String, 
      require: true 
    },
    status: {
      type: String,
      enum: Object.values(A2UPaymentStatus).filter(value => typeof value === 'string'),
      default: A2UPaymentStatus.Pending,
    },
    last_a2u_payout_date: { 
      type: Date, 
      default: null 
    },
    num_retries: { 
      type: Number, 
      default: 0 
    },
    last_error: { 
      type: String, 
      default: null 
    }
  },
  { timestamps: true } // Adds timestamps to track creation and update times
);

const A2UPaymentQueue = mongoose.model<A2UPaymentQueue>('A2UPaymentQueue', A2UPaymentQueueSchema);

export default A2UPaymentQueue;