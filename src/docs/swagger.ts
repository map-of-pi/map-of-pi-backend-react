import { Router } from "express";
import { env } from "../utils/env";
import { CategorySchema, PermissionSchema, RoleSchema } from "./schemas";
import { homepage } from "./homepage";
import { serve, setup } from "swagger-ui-express";

const docRouter = Router();

const options = {
  openapi: "3.0.1",
  info: {
    title: "Map Of Pi Backend Documentation",
    version: "1.0.0",
    description: "Documentation Of MAP OF PI",
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
      name: "Users",
      description: "User endpoints",
    },
    {
      name: "Profile",
      description: "Profile endpoints",
    },
    {
      name: "Address",
      description: "Address endpoints",
    },
    {
      name: "Roles",
      description: "Roles endpoints",
    },
    {
      name: "Permission",
      description: "Permission endpoints",
    },
    {
      name: "Shops",
      description: "Shops endpoints",
    },
    {
      name: "products",
      description: "products endpoints",
    },
    {
      name: "Order",
      description: "Order endpoints",
    },
    {
      name: "Product Reviews",
      description: "Product Reviews endpoints",
    },
  ],

  paths: {
    "/": {
      get: homepage,
    },
  },
  components: {
    schemas: {
      Role: RoleSchema,
      Permission: PermissionSchema,
      Category: CategorySchema,
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
