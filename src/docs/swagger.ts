import { Router } from "express";
import { serve, setup } from "swagger-ui-express";

import { env } from "../utils/env";
import { homepage } from "./homepage";

import { UserSchema, UserPreferenceSchema, SellerSchema, ReviewFeedbackSchema } from "./schemas";

import { AuthenticateUserRq } from "./components/schemas/AuthenticateUserRq";
import { AuthenticateUserRs } from "./components/schemas/AuthenticateUserRs";
import { GetAllSellersRs } from "./components/schemas/GetAllSellersRs";
import { GetSingleSellerRs } from "./components/schemas/GetSingleSellerRs";
import { RegisterNewSellerRq } from "./components/schemas/RegisterNewSellerRq";
import { RegisterNewSellerRs } from "./components/schemas/RegisterNewSellerRs";
import { UpdateSellerRq } from "./components/schemas/UpdateSellerRq";
import { UpdateSellerRs } from "./components/schemas/UpdateSellerRs";

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
    /* Users API endpoint operations */
    "/api/v1/users/authenticate": {
      post: {
        tags: ["User"],
        summary: "Authenticate User",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthenticateUserRq",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthenticateUserRs",
                },
              },
            },
          },
          400: {
            description: "Bad request",
          },
          401: {
            description: "Unauthorized",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    /* Sellers API endpoint operations */
    '/api/v1/sellers': {
      get: {
        tags: ['Seller'],
        summary: 'Get all sellers',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/GetAllSellersRs',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/api/v1/sellers/{seller_id}': {
      get: {
        tags: ['Seller'],
        summary: 'Get a single seller by seller ID',
        parameters: [
          {
            name: 'seller_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'The ID of the seller to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GetSingleSellerRs',
                },
              },
            },
          },
          '404': {
            description: 'Seller not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
      put: {
        tags: ['Seller'],
        summary: 'Update a seller',
        parameters: [
          {
            in: 'path',
            name: 'seller_id',
            required: true,
            schema: {
              type: 'string',
              example: 'test_seller_id',
            },
          },
          {
            in: 'header',
            name: 'Authorization',
            required: true,
            schema: {
              type: 'string',
              example: 'Bearer <your_token_here>',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateSellerRq',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful update',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateSellerRs',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
          '401': {
            description: 'Unauthorized - Missing or invalid token',
          },
          '403': {
            description: 'Forbidden - User does not have permission',
          },
          '404': {
            description: 'Seller not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/api/v1/sellers/register': {
      post: {
        tags: ['Seller'],
        summary: 'Register a new seller',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterNewSellerRq',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Seller registration successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegisterNewSellerRs',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
  },

  components: {
    schemas: {
      User: UserSchema,
      UserPreference: UserPreferenceSchema,
      Seller: SellerSchema,
      ReviewFeedback: ReviewFeedbackSchema,
      AuthenticateUserRq: AuthenticateUserRq,
      AuthenticateUserRs: AuthenticateUserRs,
      GetAllSellersRs: GetAllSellersRs,
      GetSingleSellerRs: GetSingleSellerRs,
      RegisterNewSellerRq: RegisterNewSellerRq,
      RegisterNewSellerRs: RegisterNewSellerRs,
      UpdateSellerRq: UpdateSellerRq,
      UpdateSellerRs: UpdateSellerRs
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
