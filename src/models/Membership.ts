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
    membership_class: {
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
    }
  },
  { timestamps: true }
);

// Creating the Membership model from the schema
const Membership = mongoose.model<IMembership>("Membership", membershipSchema);

export default Membership;