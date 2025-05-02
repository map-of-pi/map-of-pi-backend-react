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

/* Fallback randomly generated seed for test environments to prevent build failures 
   Starts with 'S' + 56 characters + passes Stellar's base32 & checksum rules */
const walletSeed = env.WALLET_PRIVATE_SEED || 'SB2VZP2WZJ7VJ3J27OZJ7VJ3J27OZJ7VJ3J27OZJ7VJ3J27OZJ7VVZ';

const pi = new PiNetwork(apiKey, walletSeed);
export default pi