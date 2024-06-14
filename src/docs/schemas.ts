export const UserSchema = {
  type: 'object',
  properties: {
    user_id: {
      type: 'string',
      description: 'Pi user ID',
    },
    user_name: {
      type: 'string',
      description: 'Name of Pi user; preset to Pi user ID',
    },
  },
  required: ['user_id', 'user_name']
};

export const UserPreferenceSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
  },
};

export const SellerSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
  },
};

export const ReviewFeedbackSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
  },
};
