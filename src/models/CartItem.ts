import mongoose, { Schema, Types } from "mongoose";
import { ICartItem } from "../types";

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Types.ObjectId, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const CartItem = mongoose.model<ICartItem>("CartItem", cartItemSchema);

export default CartItem;
