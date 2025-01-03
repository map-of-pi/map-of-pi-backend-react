import mongoose, { Schema, Document } from "mongoose";
import { MembershipType } from "../models/enums/memberShipType";

export interface ITier extends Document {
  class: MembershipType;
  mappiAllowance: number;
  durationWeeks: number;
  cost: number;
  badge: string;
  priorityLevel: number;
}

const tierSchema: Schema = new Schema(
  {
    class: { type: String, enum: Object.values(MembershipType), required: true, unique: true },
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