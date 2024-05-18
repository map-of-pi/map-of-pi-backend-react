import mongoose, { Schema } from "mongoose";
import { IRole } from "../types";

const roleSchema = new Schema<IRole>(
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

const Role = mongoose.model<IRole>("Role", roleSchema);

export default Role;
