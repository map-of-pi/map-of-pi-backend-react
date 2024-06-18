export const AuthenticateUserRq = {
  type: "object",
  properties: {
    auth: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          example: "piuser",
        },
        username: {
          type: "string",
          example: "piuser",
        },
      },
      required: ["uid", "username"],
    },
  },
  required: ["auth"],
};
