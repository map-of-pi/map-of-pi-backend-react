import cloudinary from '../../utils/cloudinary';
import logger from '../../config/loggingConfig';

export const uploadImage = async (file: Express.Multer.File) => {
  try {
    const result = await cloudinary.uploader.upload(file.path);
    logger.info('Image has been uploaded successfully');
    return result.secure_url;
  } catch (error: any) {
    logger.error(`Failed to upload image: ${error.message}`);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};
