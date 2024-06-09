import mongoose, { Schema } from "mongoose";

import { IUser_ } from "../types";

const userSchema = new Schema<IUser_>(
  {
    user_id: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
    }
  }
);

const User = mongoose.model<IUser_>("User_", userSchema);

export default User;
