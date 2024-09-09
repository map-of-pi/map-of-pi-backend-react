import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
  PORT: process.env.PORT || 8001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  PI_API_KEY: process.env.PI_API_KEY || '',
  PLATFORM_API_URL: process.env.PLATFORM_API_URL || '',
  UPLOAD_PATH: process.env.UPLOAD_PATH || '',
  MONGODB_URL: process.env.MONGODB_URL || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  DEVELOPMENT_URL: process.env.DEVELOPMENT_URL || '',
  PRODUCTION_URL: process.env.PRODUCTION_URL || '',
  CORS_ORIGIN_URL: process.env.CORS_ORIGIN_URL || ''
};
