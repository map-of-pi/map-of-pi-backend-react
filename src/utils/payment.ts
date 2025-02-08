import { platformAPIClient } from "../config/platformAPIclient";

// Validate transaction ID
export const validateTxId = async (txId: string): Promise<boolean> => {
  try {
    // Use platformAPIClient to call the Pi Network API
    const response = await platformAPIClient.get(`/transactions/${txId}`);
    return response.data.verified === true;
  } catch (error) {
    console.error("Error validating txId:", error);
    return false;
  }
};