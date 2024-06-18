import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";

const startServer = async () => {
  console.log("Starting server setup...");
  try {
    await connectDB();
    // in a non-serverless environment, start the server
    if (env.NODE_ENV !== 'production') {
      // create a promise that resolves when the server starts listening
      await new Promise<void>((resolve) => {
        app.listen(env.PORT, () => {
          console.log(`Server is running on port ${env.PORT}`);
          resolve();
        });
      });
    }
    console.log("Server setup initiated");
  } catch (error: any) {
    console.error("Server failed to run", error.message);
  }
};

// Start the server setup process
startServer();

export default app;
