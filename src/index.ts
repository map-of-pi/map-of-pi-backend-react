import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";

app.listen(env.PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${env.PORT}`);
  } catch (error: any) {
    console.log("Server failed to run", error.message);
  }
});
