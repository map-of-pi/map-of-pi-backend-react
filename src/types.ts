  import { Document, Types } from "mongoose";
  import { DeviceLocationType } from "./models/enums/deviceLocationType";
  import { RatingScale } from "./models/enums/ratingScale";
  import { SellerType } from "./models/enums/sellerType";
  import { TrustMeterScale } from "./models/enums/trustMeterScale";
  import { RestrictedArea } from "./models/enums/restrictedArea";

  // User
  export interface IUser extends Document {
    pi_uid: string;
    pi_username: string;
    user_name: string;
  }

  // User Settings
  export interface IUserSettings extends Document {
    user_settings_id: string;
    user_name: string;
    email?: string | null;
    phone_number?: string | null;
    image?: string; 
    findme: DeviceLocationType;
    trust_meter_rating: TrustMeterScale;
    search_map_center?: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  // Membership
  export interface IMembership extends Document {
      user_id: Types.ObjectId;
      membership_class: string;
      mappi_balance: number;
      membership_expiration: Date | null;
      mappi_used_to_date: number;
  }

  // Seller
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

  // Review Feedback
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

  // Sanctioned Regions
  export interface ISanctionedRegion extends Document {
    location: RestrictedArea;
    boundary: {
      type: 'Polygon';
      coordinates: [[[number, number]]];
    };
  }

  export interface CompleteFeedback {
    givenReviews: IReviewFeedbackOutput[];
    receivedReviews: IReviewFeedbackOutput[];
  }

  export interface IMapCenter {
    type: 'Point';
    coordinates: [number, number];
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

  export type SanctionedSeller = Pick<ISeller, 'seller_id' | 'name' | 'address' | 'sell_map_center'> & { sanctioned_location: string };