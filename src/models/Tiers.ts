import mongoose, { Schema, Document } from "mongoose";
import { MembershipClassType } from "./enums/membershipClassType";

export interface ITier extends Document {
  class: MembershipClassType;
  mappiAllowance: number;
  durationWeeks: number;
  cost: number;
  badge: string;
  priorityLevel: number;
}

const tierSchema: Schema = new Schema(
  {
    class: { type: String, enum: Object.values(MembershipClassType), required: true, unique: true },
    mappiAllowance: { type: Number, required: true },
    durationWeeks: { type: Number, required: true },
    cost: { type: Number, required: true },
    badge: { type: String, required: true },
    priorityLevel: { type: Number, required: true },
  },
  { timestamps: true }
);

const Tier = mongoose.model<ITier>("Tier", tierSchema);

export default Tier;