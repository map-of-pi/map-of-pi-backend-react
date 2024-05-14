import dotenv from "dotenv"
dotenv.config()

export const env = {
    PORT:process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV as string || "development",
    API_KEY: process.env.API_KEY as string,
    PLATFORM_URL: process.env.PLATFORM_URL as string
}