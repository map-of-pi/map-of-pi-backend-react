import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Membership from '../src/models/Membership';
import User from '../src/models/User';

dotenv.config();

// populate memberships for users
const populateMemberships = async () => {
  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    console.error("MongoDB connection string is not defined in the environment variables.");
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Fetch all users, selecting only the 'pi_uid' field to minimize data transfer
    const users = await User.find({}, 'pi_uid');
    if (!users.length) {
      console.log('No users found. Exiting.');
      return;
    }

    // Fetch all existing memberships, selecting only the 'membership_id' field
    const existingMemberships = await Membership.find({}, 'membership_id');
     // Create a Set of existing membership IDs for fast lookup
    const existingIds = new Set(existingMemberships.map(m => m.membership_id));

    // Filter users who don't have a membership yet and prepare new membership entries
    const membershipsToCreate = users
      .filter(user => !existingIds.has(user.pi_uid))
      .map(user => ({
        membership_id: user.pi_uid,
        membership_class: "Casual",
        membership_expiry_date: null,
        mappi_balance: 0
      }));

    if (!membershipsToCreate.length) {
      console.log('All users already have memberships.');
      return;
    }

    // Bulk insert new memberships into the Membership collection
    await Membership.insertMany(membershipsToCreate);
    
    console.log(`Created ${membershipsToCreate.length} new memberships.`);
  } catch (error) {
    console.error("Error populating memberships:", error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

populateMemberships();