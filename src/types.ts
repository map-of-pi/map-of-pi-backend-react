import { Document, Types } from "mongoose";

export interface IUser extends Document {
  pi_uid: string;
  pi_username: string;
  user_name: string;
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
  image: string;
  address: string;
  sale_items: string; // Adjust this to an array if necessary
  average_rating: Types.Decimal128;
  trust_meter_rating: number;
  sell_map_center: {
    type: string;

    coordinates: [number, number];
  };
  order_online_enabled_pref: boolean;
}

export interface IReviewFeedback extends Document {
  review_id: string;
  review_receiver_id: string;
  review_giver_id: string;
  reply_to_review_id: string | null;
  rating: number;
  comment?: string;
  image?: string;
  review_date: Date;
}
