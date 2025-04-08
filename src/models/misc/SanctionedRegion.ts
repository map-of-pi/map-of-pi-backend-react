import mongoose, { Schema } from "mongoose";

import { ISanctionedRegion } from "../../types";
import { RestrictedArea } from "../enums/restrictedArea";

const sanctionedRegionSchema = new Schema<ISanctionedRegion>(
  {
    location: {
      type: String,
      enum: Object.values(RestrictedArea).filter(value => typeof value === 'string'),
      required: true,
    },
    boundary: {
      type: { type: String, enum: ["Polygon"], required: true },
      coordinates: { type: [[[Number]]], required: true },
    }
  },
  {
    timestamps:true
  }
);

sanctionedRegionSchema.index({ boundary: '2dsphere' });

// Creating the SanctionedRegion model from the schema
const SanctionedRegion = mongoose.model<ISanctionedRegion>("Sanctioned-Region", sanctionedRegionSchema);

export default SanctionedRegion;
