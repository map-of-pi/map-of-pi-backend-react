import mongoose from "mongoose";
import { MembershipClassType } from "./enums/membershipClassType";

const membershipSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pi_uid: {
      type: String,
      required: true,
    },
    membership_class: {
      type: String,
      required: true,
      default: MembershipClassType.CASUAL,
      enum: Object.values(MembershipClassType),
    },
    mappi_balance: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: (value: number) => value >= 0,
        message: "mappi_balance must be a non-negative number.",
      },
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

// Indexes
membershipSchema.index({ user_id: 1 });
membershipSchema.index({ pi_uid: 1 });

export default mongoose.model('Membership', membershipSchema);
