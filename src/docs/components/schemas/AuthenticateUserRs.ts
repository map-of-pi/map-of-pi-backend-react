export const AuthenticateUserRs = {
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        _id: {
          type: "string",
          example: "666bbae4a05bcc3d8dfab563",
        },
        user_id: {
          type: "string",
          example: "12345",
        },
        username: {
          type: "string",
          example: "testuser",
        },
        __v: {
          type: "integer",
          example: 0,
        },
      },
      required: ["_id", "user_id", "username", "__v"],
    },
    token: {
      type: "string",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjZiYmFlNGEwNWJjYzNkOGRmYWI1NjMiLCJpYXQiOjE3MTgzMzk0MDksImV4cCI6MTcyMDkzMTQwOX0.gFz-EdHoOqz3-AuFX5R4uGtruFaTMH8sTOXEX-3c7yw",
    },
  },
  required: ["user", "token"],
};
