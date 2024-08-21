import { Request, Response, NextFunction } from "express";

import logger from '../config/loggingConfig';

const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.info(`Endpoint: ${req.method} ${req.originalUrl}`);
  logger.debug("Request Body:", req.body);
  return next();
};

export default requestLogger;
