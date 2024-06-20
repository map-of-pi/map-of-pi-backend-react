export const GetUserPreferencesRs = {
  type: "object",
  properties: {
    user_settings_id: {
      type: "string",
      example: "test_user_preferences",
    },
    email: {
      type: "string",
      example: "test_user_preferences@example.com",
    },
    phone_number: {
      type: "number",
      example: 123456789,
    },
    image: {
      type: "string",
      example: "https://example.com/image.jpg",
    },
    search_map_center: {
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
            example: [-73.856077, 40.848447],
          },
        },
      },
      required: ["type", "coordinates"],
    },
    _id: {
      type: "string",
      example: "6673a08503852cb0c9b618d9",
    },
    __v: {
      type: "number",
      example: 0,
    },
  },
  required: [
    "user_settings_id",
    "email",
    "phone_number",
    "image",
    "search_map_center",
    "_id",
    "__v",
  ],
};
