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
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
    sell_map_center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
  }
);

const MapCenter = mongoose.model<IMapCenter>('MapCenter', mapCenterSchema);

export default MapCenter;
