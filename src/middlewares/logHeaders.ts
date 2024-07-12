import { NextFunction, Request, Response } from "express";

export const logHeaders = (req: Request, res: Response, next: NextFunction) => {
  console.log('Request Headers:', req.headers);
  next();
};