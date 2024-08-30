import { Request, Response } from 'express';

import Image from '../../models/Image';
import cloudinary from '../../utils/cloudinary';
import logger from '../../config/loggingConfig';

export const getImage = async (req: Request, res: Response) => {
  try {
    const images = await Image.find();
    logger.info(`Fetched image successfully`);
    return res.status(200).json({ images });
  } catch (error: any) {
    logger.error(`Failed to get image: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      logger.warn(`No image provided`);
      return res.status(400).json({ message: "No image provided" });
    } else {
      const result = await cloudinary.uploader.upload(req.file.path);
      const newImage = await Image.create({
        image: result.secure_url,
      });
      logger.info('Upload image successfully');
      res.status(200).json({ newImage });
    }
  } catch (error: any) {
    logger.error(`Failed to upload image: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
}
