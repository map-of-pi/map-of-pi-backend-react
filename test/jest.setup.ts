import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import * as mockData from './mockData.json';
import User from '../src/models/User';
import UserSettings from '../src/models/UserSettings';
import Seller from '../src/models/Seller';
import SellerItem from '../src/models/SellerItem';
import ReviewFeedback from '../src/models/ReviewFeedback';
import SanctionedRegion from '../src/models/misc/SanctionedRegion';
import Toggle from '../src/models/misc/Toggle';

// mock the Winston logger
jest.mock('../src/config/loggingConfig', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// allow ample time to start running tests
// TODO - replace mockData.json file w/ mocks to lessen timeout value.
jest.setTimeout(500000);

// MongoDB memory server setup
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'mapofpi-test-db' });

    // Load the mock data into Map of PI DB collections
    await User.insertMany(mockData.users);
    await UserSettings.createIndexes();
    await UserSettings.insertMany(mockData.userSettings);
    // Ensure indexes are created for the schema models before running tests
    await Seller.createIndexes();
    await Seller.insertMany(mockData.sellers);
    await SellerItem.createIndexes();
    await SellerItem.insertMany(mockData.sellerItems);
    await ReviewFeedback.insertMany(mockData.reviews);
    await SanctionedRegion.insertMany(mockData.sanctionedRegion);
    await Toggle.insertMany(mockData.toggle);
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
