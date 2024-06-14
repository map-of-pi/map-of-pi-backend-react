export const AuthenticateUserRq = {
  type: "object",
  properties: {
    auth: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          example: "piuser",
        },
        user_name: {
          type: "string",
          example: "piuser",
        },
      },
      required: ["user_id", "user_name"],
    },
  },
  required: ["auth"],
};
