import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

import { FulfillmentType } from "./enums/fulfillmentType";
import { OrderStatusType } from "./enums/orderStatusType";
import { IOrder } from "../types";

const orderSchema = new Schema<IOrder>(
  {
    payment_id: {
      type: SchemaTypes.ObjectId,
      required: true,
      default: null
    },
    buyer_id: {
      type: String,
      required: true,
    },
    seller_id: {
      type: String,
      required: true,
    },
    total_amount: {
      type: Types.Decimal128,
      required: true,
      default: 0.00
    },
    is_paid: {
      type: Boolean,
      default: false,
      required: true
    },
    is_fulfilled: {
      type: Boolean,
      default: false,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(OrderStatusType).filter(value => typeof value === 'string'),
      required: true,
      default: OrderStatusType.Pending,
    },
    fulfillment_method: {
      type: String,
      enum: Object.values(FulfillmentType).filter(value => typeof value === 'string'),
      default: FulfillmentType.CollectionByBuyer
    },
    buyer_fulfillment_description: {
      type: String,
      required: false,
      default: ""
    }, 
    seller_fulfillment_description: {
      type: String,
      required: false,
      default: ""
    }
  },
  { timestamps: true } // Adds timestamps to track creation and update times
);

// Creating the Order model from the schema
const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
