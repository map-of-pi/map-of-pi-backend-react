import mongoose, { Schema } from "mongoose";

import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    pi_uid: {
      type: String,
      required: true,
      unique: true,
    },
    pi_username: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    }
  }, 
  { timestamps: true } // Adds timestamps to track creation and update times
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
