import mongoose, { model, Schema, Types } from "mongoose";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    uid: {
      type: String,
      required: true,
    },
    address: {
      type: Types.ObjectId,
      ref: "Address",
      required: false,
    },
    transactions: [
      {
        type: Types.ObjectId,
        ref: "Transaction",
        required: false,
      },
    ],
    orders: [
      {
        type: Types.ObjectId,
        ref: "Order",
        required: false,
      },
    ],
    role: [
      {
        type: Types.ObjectId,
        ref: "Role",
        required: true,
      },
    ],
    permission: [
      {
        type: Types.ObjectId,
        ref: "Permission",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>("User", userSchema);

export default User;
