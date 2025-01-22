import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
    paymentId: string;
    txId: string;
    pi_uid: string;
    amount: number;
    memo: string;
    metadata: Record<string, any>;
    status: "pending" | "approved" | "completed" | "failed";
    cratedAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
    {
        paymentId: { type: String, required: true, unique: true },
        txId: {type: String, required: false },
        amount: { type: Number, required: true },
        memo: {type: String, required: false },
        metadata: { type: Schema.Types.Mixed, required: true },
        type: {
            type: String,
            required: true,
            enum: ["membership_upgrade", "mappi_purchase", "refund"],
        },
        status: {
            type: String, 
            enum: ["pending", "approved", "completed", "failed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);