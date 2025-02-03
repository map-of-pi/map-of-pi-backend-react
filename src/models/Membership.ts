import mongoose, { Schema } from "mongoose";

import { IMembership } from "../types";
import { MembershipClassType } from "./enums/membershipClassType";

const membershipSchema = new Schema<IMembership>(
  {
    membership_id: {
      type: String,
      required: true,
      unique: true,
    },
    membership_class_type: {
      type: String,
      enum: Object.values(MembershipClassType).filter(value => typeof value === 'string'),
      required: true,
      default: MembershipClassType.CASUAL,
    },
    membership_expiry_date: {
      type: Date,
      required: false,
      default: null,
    },
    mappi_balance: {
      type: Number,
      default: 0,
      required: true,
    },
    mappi_allowance_usage: [
      {
        date: { type: Date, required: true },
        purpose: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Membership', membershipSchema);