import Admin from "../models/Admin";
import { decodeAdminToken, generateAdminToken } from "../helpers/jwt";
import { IAdmin } from "../types";

export const loginAdmin = async (
  email: string, 
  password: string
): Promise<{ admin: IAdmin; token: string }> => {
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new Error("Admin not found.");
  }

  const isPasswordMatch = admin.password === password; // Consider using bcrypt for security
  if (!isPasswordMatch) {
    throw new Error("Invalid credentials.");
  }

  const token = generateAdminToken(admin);
  return { admin, token };
};

export const registerAdmin = async (email: string, password: string): Promise<IAdmin> => {
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new Error("Admin already exists.");
  }

  return await Admin.create({ email, password });
};

export const getAdminInfoByToken = async (token: string): Promise<IAdmin> => {
  const admin = await decodeAdminToken(token);
  if (!admin) {
    throw new Error("Admin not found.");
  }
  return admin;
};

export const activateAdminById = async (id: string): Promise<IAdmin> => {
  const admin = await Admin.findByIdAndUpdate(id, { isActive: true }, { new: true });
  if (!admin) {
    throw new Error("Admin not found.");
  }
  return admin;
};

export const deactivateAdminById = async (id: string): Promise<IAdmin> => {
  const admin = await Admin.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!admin) {
    throw new Error("Admin not found.");
  }
  return admin;
};
