import mongoose, { Schema, Types } from "mongoose";

import { ISellerItem } from "../types";
import { StockLevelType } from "./enums/stockLevelType";

const sellerItemSchema = new Schema<ISellerItem>(
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
        default: null
    },
    price: {
        type: Number,
        required: true,
        default: 0.01
    },
    stock_level: {
        type: String,
        enum: Object.values(StockLevelType).filter(value => typeof value === 'string')
    },
    image: {
        type: String,
        required: false,
        default: null
    },
    duration: {
        type: Types.Decimal128,
        default: 1,
        min: 1        
    },
    created_at: {
        type: Date,
        required: true,
    },
    updated_at: {
        type: Date,
        required: true,
    },
    expired_by: {
        type: Date,
        required: true,
    }
  }
);

// Creating the Seller model from the schema
const SellerItem = mongoose.model<ISellerItem>("Seller-Item", sellerItemSchema);

export default SellerItem;
