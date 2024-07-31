import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for MapCenter document
export interface IMapCenter extends Document {
  pi_uid: string; // Unique user identifier
  latitude: number; // Latitude of the map center
  longitude: number; // Longitude of the map center
}

// Define the schema for MapCenter
const MapCenterSchema: Schema = new Schema({
  pi_uid: { type: String, required: true, unique: true }, // Unique user identifier, required
  latitude: { type: Number, required: true }, // Latitude of the map center, required
  longitude: { type: Number, required: true }, // Longitude of the map center, required
});

// Export the model for use in the application
export default mongoose.model<IMapCenter>('MapCenter', MapCenterSchema);
