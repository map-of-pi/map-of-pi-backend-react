import mongoose, { Schema } from "mongoose";
import { IShippingMethod } from "../types";

const deliveryMethodSchema = new Schema<IShippingMethod>(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryMethod = mongoose.model<IShippingMethod>(
  "DeliveryMethod",
  deliveryMethodSchema
);

export default DeliveryMethod;
