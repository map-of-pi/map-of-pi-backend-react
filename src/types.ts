import { Document, Types } from "mongoose";

import { RatingScale } from "./models/enums/ratingScale";
import { TrustMeterScale } from "./models/enums/trustMeterScale";

export interface IUser extends Document {
  user_id?: string;
  username: string;
}

export interface IUserSettings extends Document {
  user_settings_id: string;
  email?: string;
  phone_number?: number;
  image?: string; 
  search_map_center?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface ISeller extends Document {
  seller_id: string;
  name: string;
  description: string;
  image?: string;
  address?: string;
  sale_items?: string;
  average_rating: Types.Decimal128;
  trust_meter_rating: TrustMeterScale;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  order_online_enabled_pref: boolean;
}

export interface IReviewFeedback extends Document {
  review_id: string;
  review_receiver_id: string;
  review_giver_id: string;
  reply_to_review_id: string;
  rating: RatingScale;
  comment?: string;
  image?: string;
  review_date: Date;
}

/* ------- NOT IN PIFEST SCOPE ------- */

export interface IShop extends Document {
  name: string;
  description: string;
  address: string;
  phone?: number;
  email?: string;
  online_orders_enabled: boolean;
  images: string[];
  products?: Types.ObjectId[];
  owner?: Types.ObjectId;
  reviews?: Types.ObjectId[];
  rating?: number;
  orders?: Types.ObjectId[];
}

export interface IReview extends Document {
  productId?: Types.ObjectId;
  message: string;
  rating?: number;
  reviewer?: Types.ObjectId;
}

export interface IAuthResult {
  accessToken: string;
  user: {
    username: string;
    uid: string;
    roles: string[];
  };
}
