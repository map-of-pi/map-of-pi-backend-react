import axios from "axios";
import Pi from "pi-backend";
import { env } from "../utils/env";

export const platformAPIClient = axios.create({
  baseURL: env.PLATFORM_API_URL,
  timeout: 20000,
  headers: {
    Authorization: `Key ${env.PI_API_KEY}`,
  },
});

const apiKey = env.PI_API_KEY || '';
const walletSeed = env.WALLET_PRIVATE_SEED || '';

export const piNetwork = new Pi(apiKey, walletSeed); 