// Payments endpoint under /payments:
import { Router, Request, Response } from "express";
import mountPaymentsEndpoints from "../helpers/payments";


export const paymentsRouter = Router();
mountPaymentsEndpoints(paymentsRouter);


