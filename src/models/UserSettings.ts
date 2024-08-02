import mongoose, { Schema } from "mongoose";

import { IUserSettings } from "../types";

const userSettingsSchema = new Schema<IUserSettings>(
  {
    user_settings_id: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: false,
    },
    phone_number: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    search_map_center: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0]
      },
    }
  }
);

// use GeoJSON format to store geographical data i.e., points using '2dsphere' index.
userSettingsSchema.index({ search_map_center: '2dsphere' });

const UserSettings = mongoose.model<IUserSettings>("User-Settings", userSettingsSchema);

export default UserSettings;
