import mongoose, { Schema, Types, Document } from "mongoose";
import { TrustMeterScale } from "./enums/trustMeterScale";

// Defining the ISeller interface for TypeScript
export interface ISeller extends Document {
  seller_id: string;
  name: string;
  description: string;
  image?: string;
  address?: string;
  sale_items?: string;
  average_rating: Types.Decimal128;
  trust_meter_rating: number;
  coordinates: {
    type: "Point"; // Ensuring this is always "Point"
    coordinates: [number, number];
  };
  order_online_enabled_pref: boolean;
}

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
      enum: Object.values(TrustMeterScale).filter(value => typeof value === 'number'),
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
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
