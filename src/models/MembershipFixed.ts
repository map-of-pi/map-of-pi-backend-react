
import mongoose from "mongoose";
const membershipSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        membership_class: {
            type: String,
            required: true,
            default: 'Casual',
            enum: ["Triple Gold", "Double Gold", "Gold", "Green", "Member", "Casual"],
        },
        mappi_balance: {
            type: Number,
            default: 0,
            required: true,
        },
        membership_expiration: {
            type: Date,
            required: false,
            default: null,
        },
        mappi_used_to_date: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    { timestamps: true }
);
export default mongoose.model('Membership', membershipSchema);