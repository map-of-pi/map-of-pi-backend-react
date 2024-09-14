import mongoose, { Schema } from 'mongoose';
import { IMapCenter } from '../types';

const mapCenterSchema = new Schema<IMapCenter>(
  {
    map_center_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    search_map_center: {
      type: {
        type: String, // Corrected to use `type` directly
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // Corrected to use `type` directly
        index: '2dsphere',
      },
    },
    sell_map_center: {
      type: {
        type: String, // Corrected to use `type` directly
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // Corrected to use `type` directly
        index: '2dsphere',
      },
    },
  }
);

const MapCenter = mongoose.model<IMapCenter>('MapCenter', mapCenterSchema);

export default MapCenter;
