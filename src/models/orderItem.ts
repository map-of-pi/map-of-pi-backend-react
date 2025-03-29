import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

import { IOrderItem } from "../types";
import { OrderItemStatus } from "./enums/orderItemStatus";

  const orderItemSchema = new Schema<IOrderItem>(
    {
      seller_item: {
        type: SchemaTypes.ObjectId,
        required: true,
      },
      order: {
        type: SchemaTypes.ObjectId,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 0
      },
      sub_total_amount: {
        type: Number,
        required: true,
        default: 0.00
      },
      status: {
        type: String,
        enum: Object.values(OrderItemStatus).filter(value => typeof value === 'string'),
        required: true,
        default: OrderItemStatus.Pending,
      },
    },
    { timestamps: true } // Adds timestamps to track creation and update times
  );
  // Creating the Seller model from the schema
  const OrderItem = mongoose.model<IOrderItem>("OrderItem", orderItemSchema);

  export default OrderItem;
