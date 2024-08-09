import mongoose, { Schema } from 'mongoose';
import { IMapCenter } from '../types';

const mapCenterSchema = new Schema<IMapCenter>(
  {
    pi_uid: { 
      type: String, 
      required: true, 
      unique: true 
    },
    latitude: { 
      type: Number, 
      required: true 
    },
    longitude: { 
      type: Number, 
      required: true 
    }
  }
);

const MapCenter = mongoose.model<IMapCenter>("MapCenter", mapCenterSchema);

export default MapCenter;
