import mongoose, { Schema } from "mongoose";
import { IPermission } from "../types";

const permissionSchema = new Schema<IPermission>(
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

const Permission = mongoose.model<IPermission>("Permission", permissionSchema);

export default Permission;
