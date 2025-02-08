import mongoose, { Schema } from "mongoose";

const PaymentSchema: Schema = new Schema(
    {
        paymentId: { type: String, required: true, unique: true },
        txId: {type: String, required: false },
        pi_uid: {type: String, required: true},
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

export default mongoose.model("Payment", PaymentSchema);