import mongoose, { Schema, Types } from "mongoose";

import { ISeller } from "../types";
import { TrustMeterScale } from "./enums/trustMeterScale"; // Ensure this import is correct

const sellerSchema = new Schema<ISeller>(
  {
    seller_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    seller_type: {
      type: String,
      required: true,
      default: 'Pioneer',
    },
    description: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    sale_items: {
      type: String,
      required: false,
    },
    average_rating: {
      type: Types.Decimal128,
      required: true,
      default: 5.0,
    },
    trust_meter_rating: {
      type: Number,
      enum: Object.values(TrustMeterScale).filter(value => typeof value === 'number'),
      required: true,
      default: TrustMeterScale.HUNDRED,
    },
    sell_map_center: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0]
      },
    },
    order_online_enabled_pref: {
      type: Boolean,
      required: false,
    }
  },
  { timestamps: true } // Adds timestamps to track creation and update times
);

// Creating a 2dsphere index for the sell_map_center field
sellerSchema.index({ 'sell_map_center.coordinates': '2dsphere' });

// Creating the Seller model from the schema
const Seller = mongoose.model<ISeller>("Seller", sellerSchema);

export default Seller;
