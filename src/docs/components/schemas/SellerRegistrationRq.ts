export const SellerRegistrationRq = {
  type: "object",
  properties: {
    seller_id: {
      type: "string",
      example: "test_seller_id",
    },
    name: {
      type: "string",
      example: "Test Seller",
    },
    description: {
      type: "string",
      example: "This is a sample seller description.",
    },
    image: {
      type: "string",
      example: "http://example.com/image.jpg",
    },
    address: {
      type: "string",
      example: "1234 Test St, Test City, SC 12345",
    },
    sale_items: {
      type: "string",
      example: "Test Item 1, Test Item 2",
    },
    average_rating: {
      type: "number",
      example: 4.5,
    },
    trust_meter_rating: {
      type: "number",
      example: 50,
    },
    coordinates: {
      type: "object",
      properties: {
        type: {
          type: "string",
          example: "Point",
        },
        coordinates: {
          type: "array",
          items: {
            type: "number",
            example: [125.6, 10.1],
          },
        },
      },
      required: ["type", "coordinates"],
    },
    order_online_enabled_pref: {
      type: "boolean",
      example: true,
    },
  },
  required: [
    "seller_id",
    "name",
    "description",
    "average_rating",
    "trust_meter_rating",
    "order_online_enabled_pref",
  ],
};
