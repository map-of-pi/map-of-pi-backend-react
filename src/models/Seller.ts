import mongoose, { Schema, Types } from "mongoose";

import { TrustMeterScale } from "./enums/trustMeterScale";
import { ISeller } from "../types";

// Defining the seller schema
const sellerSchema = new Schema<ISeller>(
  {
    seller_id: {
      type: String,
      required: true,
      unique: true, // Ensures unique seller_id
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
      required: true,
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
    },
    sell_map_center: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0]
      },
    },
    order_online_enabled_pref: {
      type: Boolean,
      required: true,
    }
  },
  { timestamps: true } // Adds timestamps to track creation and update times
);

// Creating a 2dsphere index for the coordinates field
sellerSchema.index({ coordinates: '2dsphere' });

// Creating the Seller model from the schema
const Seller = mongoose.model<ISeller>("Seller", sellerSchema);

export default Seller;
