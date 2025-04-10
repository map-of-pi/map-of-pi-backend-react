import mongoose, { Schema, SchemaTypes } from "mongoose";
import { PaymentCrossReferenceType } from "../types";
import { U2UPaymentStatus } from "./enums/u2uPaymentStatus";

const paymentCrossReferenceSchema = new Schema<PaymentCrossReferenceType>(
  {
    u2a_payment_id: {
      type: SchemaTypes.ObjectId,
      required: true,
      nullable: true,
      default: null
    },
    a2u_payment_id: {
      type: SchemaTypes.ObjectId,
      required: true,
      nullable: true,
      default: null
    },
    u2u_status: {
      type: String,
      enum: Object.values(U2UPaymentStatus).filter(value => typeof value === 'string'),
      required: true,
      default: U2UPaymentStatus.Pending,
    },
    error_message: {
      type: String,
      required: false,
      default: '',
    },
    u2a_completed_at: {
      type: Date,
      required: false,
    },
    a2u_completed_at: {
      type: Date,
      required: false,
    },
    
  }, {timestamps: true} // Adds timestamps to track creation and update times
);

const PaymentCrossReference = mongoose.model<PaymentCrossReferenceType>("PaymentCrossReference", paymentCrossReferenceSchema);

export default PaymentCrossReference;