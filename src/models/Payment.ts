  import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

  import { IPayment } from "../types";
import { PaymentType } from "./enums/paymentType";

  const paymentSchema = new Schema<IPayment>(
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
      pi_payment_id: {
        type: String,
        required: true,
        default: null
      },
      txid: {
        type: String,
        required: false,
        default: null
      },
      payment_type: {
        type: String,
        required: true,
        enum: Object.values(PaymentType).filter(value => typeof value === 'string'),
        default: PaymentType.BuyerCheckout
      }
    }, { timestamps: true } // Adds timestamps to track creation and update times
  );
  // Creating the Seller model from the schema
  const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

  export default Payment;
