import { Document, Types } from "mongoose";
import { DeviceLocationType } from "./models/enums/deviceLocationType";
import { RatingScale } from "./models/enums/ratingScale";
import { SellerType } from "./models/enums/sellerType";
import { FulfillmentType } from "./models/enums/fulfillmentType";
import { StockLevelType } from "./models/enums/stockLevelType";
import { TrustMeterScale } from "./models/enums/trustMeterScale";
import { RestrictedArea } from "./models/enums/restrictedArea";
import { OrderStatusType } from "./models/enums/orderStatusType";
import { OrderItemStatusType } from "./models/enums/orderItemStatusType";
import { PaymentType } from "./models/enums/paymentType";
import { U2UPaymentStatus } from "./models/enums/u2uPaymentStatus";

export interface IUser extends Document {
  pi_uid: string;
  pi_username: string;
  user_name: string;
}

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
  search_filters?: {
    include_active_sellers: Boolean;
    include_inactive_sellers: Boolean;
    include_test_sellers: Boolean;
    include_trust_level_100: Boolean;
    include_trust_level_80: Boolean;
    include_trust_level_50: Boolean;
    include_trust_level_0: Boolean;
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
  fulfillment_method: FulfillmentType;
  fulfillment_description?: string;
}

export interface ISellerItem extends Document {
  _id: string;
  seller_id: string;
  name: string;
  description: string;
  price: Types.Decimal128;
  stock_level: StockLevelType;
  image?: string;
  duration: number;
  expired_by: Date;
  createdAt: Date;
  updatedAt: Date;
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


export interface IToggle extends Document {
  name: string;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

  export interface IOrder extends Document {
    buyer_id: string;
    seller_id: string;
    payment_id: Types.ObjectId;
    total_amount: Types.Decimal128;
    status: OrderStatusType;
    is_paid: boolean;
    is_fulfilled: boolean;
    fulfillment_method: FulfillmentType;
    seller_fulfillment_description: string;
    buyer_fulfillment_description: string;
    createdAt: Date;
    updatedAt: Date;
}

  
  export interface IOrderItem extends Document {
    order_id: Types.ObjectId;
    seller_item_id: Types.ObjectId;
    quantity: number;
    subtotal: Types.Decimal128;
    status: OrderItemStatusType;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface IPayment extends Document {
    user_id: Types.ObjectId;
    amount: Types.Decimal128;
    paid: boolean;
    memo: string;
    pi_payment_id: string;
    txid: string | null;
    payment_type: PaymentType;
    cancelled: boolean;
    createdAt: Date;
  }

  export interface PaymentCrossReferenceType {
    _id: Types.ObjectId;
    u2a_payment_id: Types.ObjectId;
    a2u_payment_id: Types.ObjectId;
    u2u_status: U2UPaymentStatus;
    error_message: string;
    u2a_completed_at: Date;
    a2u_completed_at: Date;
    createdAt: Date;
    updatedAt: Date;
  }
