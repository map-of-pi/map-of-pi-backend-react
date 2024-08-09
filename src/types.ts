import { Document, Types } from "mongoose";

import { RatingScale } from "./models/enums/ratingScale";
import { TrustMeterScale } from "./models/enums/trustMeterScale";

export interface IUser extends Document {
  pi_uid: string;
  pi_username: string;
  user_name: string;
}

export interface IUserSettings extends Document {
  user_settings_id: string;
  email?: string;
  phone_number?: string;
  image?: string; 
  search_map_center?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface ISeller extends Document {
  seller_id: string;
  name: string;
  seller_type: string;
  description: string;
  image?: string;
  address?: string;
  sale_items?: string;
  average_rating: Types.Decimal128;
  trust_meter_rating: TrustMeterScale;
  sell_map_center: {
    type: 'Point';
    coordinates: [number, number];
  };
  order_online_enabled_pref: boolean;
}

export interface IReviewFeedback extends Document {
  _id: string;
  review_receiver_id: string;
  review_giver_id: string;
  reply_to_review_id: string | null;
  rating: RatingScale;
  comment?: string;
  image?: string;
  review_date: Date;
}

export interface IMapCenter extends Document {
  pi_uid: string;
  latitude: number;
  longitude: number;
}