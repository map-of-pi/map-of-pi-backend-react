import { connectDB } from "./config/db";
import app from "./utils/app";
import { env } from "./utils/env";


app.listen(env.PORT, async () => {
  try {
    await connectDB()
    console.log(`server is running on port ${env.PORT}`)
  } catch (error:any) {
    console.log("Error while running dev server",error.message)
  }
})
