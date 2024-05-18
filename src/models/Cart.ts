import mongoose, { Schema, Types } from "mongoose";
import { ICart } from "../types";

const cartSchema = new Schema<ICart>({
  owner: { type: Types.ObjectId, ref: "User", required: true },
  totalPrice: { type: Number, required: true },
  items: [
    {
      type: Types.ObjectId,
      ref: "CartItem",
      required: true,
      default: [],
    },
  ],
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
