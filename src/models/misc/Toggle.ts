import mongoose, { Schema } from "mongoose";

import { IToggle } from "../../types";

const toggleSchema = new Schema<IToggle>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
  }
);

const Toggle = mongoose.model<IToggle>("Toggle", toggleSchema);

export default Toggle;
