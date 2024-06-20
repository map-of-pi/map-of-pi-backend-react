import { TrustMeterScale } from '../models/enums/trustMeterScale';

export const UserSchema = {
  type: 'object',
  properties: {
    uid: {
      type: 'string',
      description: 'Pi user ID',
    },
    username: {
      type: 'string',
      description: 'Name of Pi user; preset to Pi user ID',
    },
  },
  required: ['uid', 'username']
};

export const UserPreferencesSchema = {
  properties: {
    user_settings_id: {
      type: "string",
      description: 'Pi user ID'
    },
    email: {
      type: "string",
      description: 'Email address of the user',
    },
    phone_number: {
      type: "number",
      description: 'Phone number of the user',
    },
    image: {
      type: "string",
      description: 'Image of the user',
    },
    search_map_center: {
      type: "object",
      description: 'Geographical coordinates of the user\'s search center location',
      properties: {
        type: {
          type: "string",
        },
        coordinates: {
          type: "array",
          items: {
            type: "number",
          },
        },
      },
      required: ['type', 'coordinates'],
    },
  },
  required: ["user_settings_id"],
};

export const SellerSchema = {
  type: 'object',
  properties: {
    seller_id: {
      type: 'string',
      description: 'Pi user ID of the seller',
    },
    name: {
      type: 'string',
      description: 'Name of the seller',
    },
    description: {
      type: 'string',
      description: 'Description of the seller',
    },
    image: {
      type: 'string',
      description: 'Image of the seller',
    },
    address: {
      type: 'string',
      description: 'Address of the seller',
    },
    sale_items: {
      type: 'string',
      description: 'Sale items/ descriptions offered by the seller',
    },
    average_rating: {
      type: 'object',
      description: 'Average rating of the seller',
      properties: {
        $numberDecimal: {
          type: 'string',
        },
      },
      required: ['$numberDecimal'],
    },
    trust_meter_rating: {
      type: 'number',
      description: 'Trust-o-meter rating of the seller',
      enum: Object.values(TrustMeterScale),
    },
    coordinates: {
      type: 'object',
      description: 'Geographical coordinates of the seller\'s location',
      properties: {
        type: {
          type: 'string',
        },
        coordinates: {
          type: 'array',
          items: {
            type: 'number',
          }
        },
      },
      required: ['type', 'coordinates'],
    },
    order_online_enabled_pref: {
      type: 'boolean',
      description: 'Preference for online ordering availability',
    },
  },
  required: [
    'seller_id',
    'name',
    'description',
    'average_rating',
    'trust_meter_rating',
    'order_online_enabled_pref',
  ],
};

export const ReviewFeedbackSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
  },
};
