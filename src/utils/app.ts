
import express from 'express';
// import cors from "cors"
import bodyParser from "body-parser"
import appRouter from '../routes';


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());


app.use("/",appRouter)



export default app