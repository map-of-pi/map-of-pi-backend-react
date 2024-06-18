import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";

console.log("Starting server setup...");

const startServer = async () => {
  try {
    await connectDB();
    console.log("Successful connection to MongoDB");
    // in a non-serverless environment, start the server
    if (env.NODE_ENV !== 'production') {
      app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
      });
    }
    console.log("Server setup initiated.");
  } catch (error: any) {
    console.error("Server failed to run", error.message);
  }
};

// Start the server setup process
startServer();

export default app;
