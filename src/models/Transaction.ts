  import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

  import { ITransaction } from "../types";

  const transactionSchema = new Schema<ITransaction>(
    {
      user: {
        type: SchemaTypes.ObjectId,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        default: 0.00
      },
      paid: {
        type: Boolean,
        default: false,
        required: true
      },
      cancelled: {
        type: Boolean,
        default: false,
        required: true
      },
      memo: {
        type: String,
        required: false,
        default: ""
      },
      payment_id: {
        type: String,
        required: true,
        default: null
      },
      txid: {
        type: String,
        required: false,
        default: null
      },
    }, { timestamps: true } // Adds timestamps to track creation and update times
  );
  // Creating the Seller model from the schema
  const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);

  export default Transaction;
