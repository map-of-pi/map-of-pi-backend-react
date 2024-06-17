import mongoose, { Schema } from "mongoose";

import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    uid: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    }
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
