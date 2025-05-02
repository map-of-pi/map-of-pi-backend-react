import axios from "axios";
import PiNetwork from 'pi-backend';
import { env } from "../utils/env";

export const platformAPIClient = axios.create({
  baseURL: env.PLATFORM_API_URL,
  timeout: 20000,
  headers: {
    Authorization: `Key ${env.PI_API_KEY}`,
  },
});

const apiKey = env.PI_API_KEY || '';

// Fallback for test environments to prevent build failures
const walletSeed = env.WALLET_PRIVATE_SEED || 'S'.padEnd(56, 'X');

const pi = new PiNetwork(apiKey, walletSeed);
export default pi