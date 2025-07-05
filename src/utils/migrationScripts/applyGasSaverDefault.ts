import mongoose from 'mongoose';
import Seller from '../../models/Seller';
import dotenv from 'dotenv';
import logger from '../../config/loggingConfig';

dotenv.config(); // if using .env for DB URI


// RUN SCRIPT ONLY ONCE FOR DB MIGRATION
async function applyGasSaverDefault() {
  await mongoose.connect(process.env.MONGODB_URL || 'your_mongo_uri_here');

  const result = await Seller.updateMany(
    { gas_saver: { $exists: false } },
    { $set: { gas_saver: true } }
  );

  logger.info(`Updated ${result.modifiedCount} seller(s) with default gas_saver=true`);

  await mongoose.disconnect();
}

applyGasSaverDefault().catch(console.error);
