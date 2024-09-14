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
      latitude: { 
        type: Number, 
        required: false 
      },
      longitude: { 
        type: Number, 
        required: false 
      }
    },
    sell_map_center: { 
      latitude: { 
        type: Number, 
        required: false 
      },
      longitude: { 
        type: Number, 
        required: false 
      }
    }
  }
);

const MapCenter = mongoose.model<IMapCenter>('MapCenter', mapCenterSchema);

export default MapCenter;
