import { Router } from "express";
import { serve, setup } from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-dist";
import path from "path";

import { env } from "../utils/env";

const docRouter = Router();

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Map of Pi API Documentation",
      version: "1.0.0",
      description: "API Documentation for Map of Pi.",
      contact: {
        name: "Map of Pi Team",
        email: "philip@mapofpi.com"
      },
    },
    servers: [
      {
        url: "http://localhost:8001/",
        description: "Development server",
      },
      {
        url: env.PRODUCTION_URL,
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.{ts,js}'),
    path.join(__dirname, '../config/docs/*.yml'),
  ]
};

const specs = swaggerJsDoc(options);

docRouter.use("/", serve, setup(specs, {
  customCss: '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css', 
  swaggerUrl: path.join(__dirname, swaggerUI.getAbsoluteFSPath())
}));

export default docRouter;
