import mongoose, { Schema, Types } from "mongoose";
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
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false, // Changed to required
    },
    address: {
      type: String,
      required: true, // Changed to required
    },
    sale_items: {
      type: String,
      required: true, // Changed to required
    },
    average_rating: {
      type: Types.Decimal128,
      required: true,
      default: 5.0,
    },
    trust_meter_rating: {
      type: Number, // Changed to a number
      required: true,
    },
    sell_map_center: { // Renamed from coordinates to sell_map_center
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
sellerSchema.index({ 'sell_map_center.coordinates': '2dsphere' });

// Creating the Seller model from the schema
const Seller = mongoose.model<ISeller>("Seller", sellerSchema);

export default Seller;
