import mongoose, { Model, Types } from "mongoose";
import { IShop } from "../types";

const shopSchema = new mongoose.Schema<IShop>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: Number, required: false },
    online_orders_enabled: { type: Boolean, default: true, required: false },
    images: [{ type: String, required: true }],
    products: [{ type: Types.ObjectId, ref: "Product", default: [] }],
    owner: { type: Types.ObjectId, ref: "User", required: true },
    reviews: [{ type: Types.ObjectId, ref: "Review", default: [] }],
    rating: { type: Number, default: 0 },
    orders: [{ type: Types.ObjectId, ref: "Order", default: [] }],
  },
  {
    timestamps: true,
  }
);

const Shop = mongoose.model<IShop>("Shop", shopSchema);

export default Shop;
