export const UpdateUserPreferencesRq = {
  type: "object",
  properties: {
    email: {
      type: "string",
      example: "test_user_preferences@example.com",
    },
    phone_number: {
      type: "number",
      example: 1234567890,
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
  },
  optional: [
    "email",
    "phone_number",
    "image",
    "search_map_center",
  ],
};
