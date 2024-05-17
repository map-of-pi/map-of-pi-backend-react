import mongoose, { Schema } from "mongoose";
import { IUserProfile } from "../types";

const profileSchema = new Schema<IUserProfile>(
  {
    email: { type: Number, required: true },
    profile: { type: String, required: true },
    phone: { type: Number, required: true },
    nickname: { type: String, required: true },
    country: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model<IUserProfile>("Profile", profileSchema);
