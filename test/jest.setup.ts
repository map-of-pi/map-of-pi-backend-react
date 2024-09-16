// mock the Winston logger
jest.mock('../src/config/loggingConfig', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

// allow ample time to start running tests
jest.setTimeout(60000);
