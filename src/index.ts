import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";


connectDB().then(() => {
  app.listen(env.PORT, () =>
    console.log(`server is running on port ${env.PORT}`)
  );
}).catch((error:any)=> {
  console.log("error while running application : " + error.message)
})

