import cloudinary from "../utils/cloudinary";

export const uploadMultipleImages = async (files: any) => {
  try {
    const uploadedImages = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "uploads",
        use_filename: true,
      });

      uploadedImages.push(result.secure_url);
    }
    return uploadedImages;
  } catch (error: any) {
    throw new Error("Failed to upload images to Cloudinary: " + error.message);
  }
};

export const uploadSingleImage = async (file: any) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "uploads",
      use_filename: true,
    });
    return result.secure_url;
  } catch (error: any) {
    throw new Error("Failed to upload images to Cloudinary: " + error.message);
  }
};
