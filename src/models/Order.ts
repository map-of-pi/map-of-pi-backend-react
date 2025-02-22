  import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

  import { IOrder } from "../types";
  import { FulfillmentType } from "./enums/sellerType";
import { OrderStatusType } from "./enums/OrderStatusType";

  const orderSchema = new Schema<IOrder>(
    {
      buyer_id: {
        type: String,
        required: true,
      },
      seller_id: {
        type: String,
        required: true,
      },
      transaction: {
        type: SchemaTypes.ObjectId,
        required: true,
        default: null,
      },
      total_amount: {
        type: Number,
        required: true,
        default: 0.00
      },
      paid: {
        type: Boolean,
        default: false,
        required: true
      },
      filled: {
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
      seller_filfullment_instruction: {
        type: String,
        required: false,
        default: ""
      },
      buyer_filfullment_details: {
        type: String,
        required: false,
        default: ""
      }, 
      fulfillment_method: {
        type: String,
        enum: Object.values(FulfillmentType).filter(value => typeof value === 'string'),
        default: FulfillmentType.CollectionByBuyer
      },
    },
    { timestamps: true } // Adds timestamps to track creation and update times
  );
  // Creating the Seller model from the schema
  const Order = mongoose.model<IOrder>("Order", orderSchema);

  export default Order;
