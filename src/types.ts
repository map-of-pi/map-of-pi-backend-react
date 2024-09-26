import { Document, Types } from "mongoose";
import { RatingScale } from "./models/enums/ratingScale";
import { SellerType } from "./models/enums/sellerType";
import { TrustMeterScale } from "./models/enums/trustMeterScale";

export interface IUser extends Document {
  pi_uid: string;
  pi_username: string;
  user_name: string;
}

export interface IUserSettings extends Document {
  user_settings_id: string;
  user_name: string;
  email?: string;
  phone_number?: string;
  image?: string; 
  findme: string;
  trust_meter_rating: TrustMeterScale;
  search_map_center?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface ISeller extends Document {
  seller_id: string;
  name: string;
  seller_type: SellerType;
  description: string;
  image?: string;
  address?: string;
  average_rating: Types.Decimal128;
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
  map_center_id: string;
  search_map_center?: {
    type: 'Point';
    coordinates: [number, number];
  };
  sell_map_center?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// Select specific fields from IUserSettings
export type PartialUserSettings = Pick<IUserSettings, 'user_name' | 'email' | 'phone_number' | 'findme' | 'trust_meter_rating'>;

// Combined interface representing a seller with selected user settings
export interface ISellerWithSettings extends ISeller, PartialUserSettings {}

export type PartialReview = {
  giver: string;
  receiver: string;
}

export interface IReviewFeedbackOutput extends IReviewFeedback, PartialReview {}