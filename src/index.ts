import dotenv from "dotenv";
import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";

dotenv.config();

const startServer = async () => {
  console.log("Starting server setup...");
  try {
    // Establish connection to MongoDB
    await connectDB();

    // In a non-serverless environment, start the server
    if (env.NODE_ENV !== 'production') {
      await new Promise<void>((resolve) => {
        // Start listening on the specified port
        app.listen(env.PORT, () => {
          console.log(`Server is running on port ${env.PORT}`);
          resolve();
        });
      });
    }

    console.log("Server setup initiated");
  } catch (error: any) {
    // Log any errors that occur during server setup
    console.error("Server failed to run", error.message);
  }
};

// Start the server setup process
startServer();

export default app;
