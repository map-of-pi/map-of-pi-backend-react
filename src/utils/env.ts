import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: (process.env.NODE_ENV as string) || "development",
  PI_API_KEY: process.env.PI_API_KEY as string,
  PLATFORM_API_URL: process.env.PLATFORM_API_URL as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  MONGODB_URL: process.env.MONGODB_URL as string,
  DEVELOPMENT_URL: process.env.DEVELOPMENT_URL as string,
  PRODUCTION_URL: process.env.PRODUCTION_URL as string,
};
