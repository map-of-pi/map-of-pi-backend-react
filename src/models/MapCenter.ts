import mongoose, { Schema } from 'mongoose';
import { IMapCenter } from '../types';

// Define the schema for MapCenter
const MapCenterSchema: Schema<IMapCenter> = new Schema({
  pi_uid: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

// Export the model for use in the application
export default mongoose.model<IMapCenter>('MapCenter', MapCenterSchema);
