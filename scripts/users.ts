import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

// deduplication process of users
const dedupeUsers = async () => {
  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const duplicates = await User.aggregate([
      { $group: { _id: "$pi_uid", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const dup of duplicates) {
      const [, ...duplicateIds] = dup.ids; // keep the first, delete the rest
      await User.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`Deleted ${duplicateIds.length} duplicate(s) for pi_uid: ${dup._id}`);
    }

    console.log("All duplicates removed in MongoDB");
  } catch (error) {
    console.error("Error deduping users:", (error as Error).message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

dedupeUsers();