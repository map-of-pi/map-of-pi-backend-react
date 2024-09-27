import cloudinary from "../utils/cloudinary";

import logger from '../config/loggingConfig';

export const uploadMultipleImages = async (files: any) => {
  try {
    const uploadedImages = [];
    logger.info(`Starting upload of ${files.length} images`);

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "uploads",
        use_filename: true,
      });
      logger.debug(`Uploaded image: ${result.secure_url}`);
      uploadedImages.push(result.secure_url);
    }
    logger.info(`Successfully uploaded ${uploadedImages.length} images`);
    return uploadedImages;
  } catch (error: any) {
    logger.error('Failed to upload multiple images to Cloudinary:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to upload images; please try again');
  }
};

export const uploadSingleImage = async (file: any) => {
  try {
    logger.info(`Starting upload of single image: ${file.path}`);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "uploads",
      use_filename: true,
    });
    logger.info(`Successfully uploaded single image: ${result.secure_url}`);
    return result.secure_url;
  } catch (error: any) {
    logger.error(`Failed to upload single image to Cloudinary:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to upload single image; please try again');
  }
};
