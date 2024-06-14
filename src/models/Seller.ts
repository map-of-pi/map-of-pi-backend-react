import mongoose, { Schema, Types } from "mongoose";

import { ISeller } from "../types";

import { TrustMeterScale } from "./enums/trustMeterScale";

const sellerSchema = new Schema<ISeller>(
  {
    seller_id: {
      type: String,
      required: true,
    },
    name: { 
      type: String, 
      required: true,
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
    },
    trust_meter_rating: {
      type: Number,
      // enum: Object.values(TrustMeterScale),
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
    order_online_enabled_pref: {
      type: Boolean,
      required: true,
    }
  }
);

const Seller = mongoose.model<ISeller>("Seller", sellerSchema);

export default Seller;
