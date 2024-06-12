import { Router } from "express";
import { serve, setup } from "swagger-ui-express";

import { env } from "../utils/env";
import { homepage } from "./homepage";

import { UserSchema, UserPreferenceSchema, SellerSchema, ReviewFeedbackSchema } from "./schemas";

const docRouter = Router();

const options = {
  openapi: "3.0.1",
  info: {
    title: "Map of Pi API Documentation",
    version: "1.0.0",
    description: "API Documentation for Map of Pi.",
  },

  servers: [
    {
      url: env.DEVELOPMENT_URL,
      description: "Development server",
    },
    {
      url: env.PRODUCTION_URL,
      description: "Production server",
    },
  ],

  basePath: "/",

  tags: [
    {
      name: "Home",
      description: "Homepage",
    },
    {
      name: "User",
      description: "User endpoints and operations.",
    },
    {
      name: "UserPreference",
      description: "UserPreference endpoints and operations.",
    },
    {
      name: "Seller",
      description: "Seller endpoints and operations.",
    },
    {
      name: "ReviewFeedback",
      description: "ReviewFeedback endpoints and operations.",
    }
  ],

  paths: {
    "/": {
      get: homepage,
    },
  },

  components: {
    schemas: {
      User: UserSchema,
      UserPreference: UserPreferenceSchema,
      Seller: SellerSchema,
      ReviewFeedback: ReviewFeedbackSchema
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header",
        name: "Authorization",
      },
    },
  },
};

docRouter.use("/", serve, setup(options));

export default docRouter;
