  import mongoose, { Schema, SchemaTypes, Types } from "mongoose";

  import { IOrder } from "../types";
  import { FulfillmentType } from "./enums/sellerType";
import { OrderStatusType } from "./enums/OrderStatusType";

  const orderSchema = new Schema<IOrder>(
    {
      items: {
        type: [SchemaTypes.ObjectId],
        required: true,
      },
      buyer: {
        type: SchemaTypes.ObjectId,
        required: true,
      },
      seller: {
        type: SchemaTypes.ObjectId,
        required: true,
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
      created_at: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now(),
      },
      updated_at: {
        type: Date,
        required: true,
        default: () => Date.now(),
      },
    },
    { timestamps: true } // Adds timestamps to track creation and update times
  );
  // Creating the Seller model from the schema
  const Order = mongoose.model<IOrder>("Seller", orderSchema);

  export default Order;
