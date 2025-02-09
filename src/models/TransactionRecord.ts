import mongoose, { Schema } from "mongoose";
import { ITransactionRecord } from "../types";
import { TransactionType } from "./enums/transactionType";

const transactionRecordSchema = new Schema<ITransactionRecord>(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    transaction_record: [
      {
        transaction_type: {
          type: String,
          enum: Object.values(TransactionType).filter(value => typeof value === 'string'),
          required: true,
        },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        date: { type: Date, required: true },
      },
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Transaction-Record', transactionRecordSchema);