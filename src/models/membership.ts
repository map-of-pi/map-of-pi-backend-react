import mongoose from "mongoose";
import { MembershipTierEnum, MembershipTierKey } from "./enums/membershipClassType";
import { IMembership } from "../types";

const membershipSchema = new mongoose.Schema<IMembership>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      unique: true
    },
    pi_uid: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    membership_class: {
      type: String,
      required: true,
      default: MembershipTierEnum.TIER1,
      enum: Object.values(MembershipTierEnum)
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
      default: null
    },
    mappi_used_to_date: {
      type: Number,
      required: true,
      default: 0
    },
  },
  { timestamps: true }
);

const Membership = mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
