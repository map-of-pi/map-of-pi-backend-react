import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import SanctionedRegion from '../../src/models/misc/SanctionedRegion';
import { RestrictedAreaBoundaries } from '../../src/models/enums/restrictedArea';

dotenv.config();

// insert sanctioned areas into MongoDB
const insertSanctionedRegions = async () => {
  const mongoUri = 'mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority';
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const regions = Object.entries(RestrictedAreaBoundaries).map(([key, boundary]) => ({
      location: key,
      boundary,
    }));

    await SanctionedRegion.deleteMany(); // clear existing data
    await SanctionedRegion.insertMany(regions); // insert new data

    console.log('Inserted sanctioned regions into MongoDB');
  } catch (error) {
    console.error("Error inserting sanctioned regions:", (error as Error).message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

 // Call the function to insert sanctioned regions
insertSanctionedRegions();