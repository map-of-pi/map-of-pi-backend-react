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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },     
    membership_class: {
      type: String,
      enum: Object.values(MembershipClassType).filter(value => typeof value === 'string'),
      required: true,
      default: MembershipClassType.CASUAL,
    },
    membership_expiry_date: {
      type: Date,
      default: null,
    },
    mappi_balance: {
      type: Number,
      default: 0,
      required: true,
    },
    mappi_used_to_date: {
      type: Number,
      default: 0,
    },
    payment_history: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
  },
  { timestamps: true }
);

membershipSchema.virtual("remaining_mappi").get(function () {
  return this.mappi_balance - this.mappi_used_to_date;
});

const Membership = mongoose.model<IMembership>("Membership", membershipSchema);
export default Membership;
