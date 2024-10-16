import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import * as mockData from './mockData.json';
import User from '../src/models/User';
import UserSettings from '../src/models/UserSettings';
import Seller from '../src/models/Seller';
import ReviewFeedback from '../src/models/ReviewFeedback';

// mock the Winston logger
jest.mock('../src/config/loggingConfig', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// allow ample time to start running tests
jest.setTimeout(60000);

// MongoDB memory server setup
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'mapofpi-test-db' });

    // Load the mock data into Map of PI DB collections
    await User.insertMany(mockData.users);
    await UserSettings.insertMany(mockData.userSettings);
    await Seller.insertMany(mockData.sellers);
    await ReviewFeedback.insertMany(mockData.reviews);
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
