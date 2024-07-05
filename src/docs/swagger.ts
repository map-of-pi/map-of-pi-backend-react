import { Router } from "express";
import { serve, setup } from "swagger-ui-express";

import { homepage } from "./homepage";
import { UserSchema, UserPreferencesSchema, SellerSchema, ReviewFeedbackSchema } from "./schemas";
import { env } from "../utils/env";

import { AuthenticateUserRq } from "./components/schemas/AuthenticateUserRq";
import { AuthenticateUserRs } from "./components/schemas/AuthenticateUserRs";
import { GetUserPreferencesRs } from "./components/schemas/GetUserPreferencesRs";
import { AddUserPreferencesRq } from "./components/schemas/AddUserPreferencesRq";
import { AddUserPreferencesRs } from "./components/schemas/AddUserPreferencesRs";
import { UpdateUserPreferencesRq } from "./components/schemas/UpdateUserPreferencesRq";
import { UpdateUserPreferencesRs } from "./components/schemas/UpdateUserPreferencesRs";
import { GetAllSellersRq } from "./components/schemas/GetAllSellersRq";
import { GetAllSellersRs } from "./components/schemas/GetAllSellersRs";
import { GetSingleSellerRs } from "./components/schemas/GetSingleSellerRs";
import { RegisterNewSellerRq } from "./components/schemas/RegisterNewSellerRq";
import { RegisterNewSellerRs } from "./components/schemas/RegisterNewSellerRs";
import { UpdateSellerRq } from "./components/schemas/UpdateSellerRq";
import { UpdateSellerRs } from "./components/schemas/UpdateSellerRs";
import { GetReviewsRs } from "./components/schemas/GetReviewsRs";
import { GetSingleReviewRs } from "./components/schemas/GetSingleReviewRs";
import { AddReviewRq } from "./components/schemas/AddReviewRq";
import { AddReviewRs } from "./components/schemas/AddReviewRs";

const docRouter = Router();

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

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
      name: "User Preferences",
      description: "User Preferences endpoints and operations.",
    },
    {
      name: "Seller",
      description: "Seller endpoints and operations.",
    },
    {
      name: "Review Feedback",
      description: "Review Feedback endpoints and operations.",
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
    /* User Preferences API endpoint operations */
    '/api/v1/user-preferences/{user-settings_id}': {
      get: {
        tags: ['User Preferences'],
        summary: 'Get the user preferences by user settings ID',
        parameters: [
          {
            name: 'user_settings_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'The ID of the user preferences to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GetUserPreferencesRs',
                },
              },
            },
          },
          '404': {
            description: 'User Preferences not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
      put: {
        tags: ['User Preferences'],
        summary: 'Update the user preferences',
        parameters: [
          {
            name: 'user_settings_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserPreferencesRq',
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
                  $ref: '#/components/schemas/UpdateUserPreferencesRs',
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
            description: 'User Preferences not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/api/v1/user-preferences/add': {
      post: {
        tags: ['User Preferences'],
        summary: 'Add new user preferences',
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AddUserPreferencesRq',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User preferences added successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AddUserPreferencesRs',
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
    /* Sellers API endpoint operations */
    '/api/v1/sellers/fetch': {
      post: {
        tags: ['Seller'],
        summary: 'Get all sellers around a given location [if origin and radius are provided], otherwise, get all sellers.',
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GetAllSellersRq",
              },
            },
          }
        },
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
          '404': {
            description: 'Sellers not found around given location',
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
            name: 'seller_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
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
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
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
    /* Review Feedback API endpoint operations */
    '/api/v1/review-feedback/{review_receiver_id}': {
      get: {
        tags: ['Review Feedback'],
        summary: 'Get all associated reviews for seller',
        parameters: [
          {
            name: 'review_receiver_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'The ID of the review receiver to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/GetReviewsRs',
                  },
                },
              },
            },
          },
          '404': {
            description: 'Review not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/api/v1/review-feedback/single/{review_id}': {
      get: {
        tags: ['Review Feedback'],
        summary: 'Get a single review by review ID',
        parameters: [
          {
            name: 'review_id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'The ID of the review to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/GetSingleReviewRs',
                  },
                },
              },
            },
          },
          '404': {
            description: 'Review not found',
          },
          '500': {
            description: 'Internal server error',
          },
        },
      },
    },
    '/api/v1/review-feedback/add': {
      post: {
        tags: ['Review Feedback'],
        summary: 'Add a new review',
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AddReviewRq',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Review added successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AddReviewRs',
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
      UserPreferences: UserPreferencesSchema,
      Seller: SellerSchema,
      ReviewFeedback: ReviewFeedbackSchema,
      AuthenticateUserRq: AuthenticateUserRq,
      AuthenticateUserRs: AuthenticateUserRs,
      GetUserPreferencesRs: GetUserPreferencesRs,
      AddUserPreferencesRq: AddUserPreferencesRq,
      AddUserPreferencesRs: AddUserPreferencesRs,
      UpdateUserPreferencesRq: UpdateUserPreferencesRq,
      UpdateUserPreferencesRs: UpdateUserPreferencesRs,
      GetAllSellersRq: GetAllSellersRq,
      GetAllSellersRs: GetAllSellersRs,
      GetSingleSellerRs: GetSingleSellerRs,
      RegisterNewSellerRq: RegisterNewSellerRq,
      RegisterNewSellerRs: RegisterNewSellerRs,
      UpdateSellerRq: UpdateSellerRq,
      UpdateSellerRs: UpdateSellerRs,
      GetReviewsRs: GetReviewsRs,
      GetSingleReviewRs: GetSingleReviewRs,
      AddReviewRq: AddReviewRq,
      AddReviewRs: AddReviewRs
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

docRouter.use("/", serve, setup(options, { customCssUrl: CSS_URL }));

export default docRouter;
