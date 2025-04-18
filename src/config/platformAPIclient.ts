import axios from "axios";
import { env } from "../utils/env";
import PiNetwork from 'pi-backend';

export const platformAPIClient = axios.create({
  baseURL: env.PLATFORM_API_URL,
  timeout: 20000,
  headers: {
    Authorization: `Key ${env.PI_API_KEY}`,
  },
});



const apiKey = env.PI_API_KEY || '';
const walletSeed = env.WALLET_PRIVATE_SEED || '';

const pi = new PiNetwork(apiKey, walletSeed);
export default pi