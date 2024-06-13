import { Request, Response, NextFunction } from "express";

const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`Endpoint: ${req.method} ${req.originalUrl}`);
  console.log("Request Body:", req.body);
  return next();
};

export default requestLogger;
