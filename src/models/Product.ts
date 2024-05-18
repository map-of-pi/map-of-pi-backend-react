import mongoose, { Schema, Types } from "mongoose";
import { IProduct } from "../types";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    discount: {
      type: Number,
      required: true,
    },
    deliveryMethod: {
      type: Types.ObjectId,
      ref: "deliveryMethod",
      required: true,
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    shop: {
      type: Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    reviews: [{ type: Types.ObjectId, ref: "Review" }],
    rating: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
