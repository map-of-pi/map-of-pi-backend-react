import mongoose, { Schema } from "mongoose";
import { ICategory } from "../types";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model<ICategory>("Category", categorySchema);
