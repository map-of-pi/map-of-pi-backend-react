export const GetAllSellersRq = {
  type: "object",
  properties: {
    origin: {
      type: "object",
      properties: {
        lat: {
          type: "number",
          example: 40.7128,
        },
        lng: {
          type: "number",
          example: -74.0060,
        }
      },
      required: ["lat", "lng"],
    },
    radius: {
      type: "integer",
      example: 15,
    }
  },
};
