import mongoose from 'mongoose';
import logger from '../../config/loggingConfig';

async function dropCollection(collectionName:string) {
  try {

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established.');
    }

    const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();

    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection(collectionName);
      logger.info(`${collectionName} collection dropped.`);
    } else {
      logger.info('Collection does not exist.');
    }
  } catch (err) {
    console.error('Error dropping collection:', err);
  }
}

export default dropCollection;
