import { Request, Response } from "express";
import Admin from "../../models/Admin";
import { decodeAdminToken, generateAdminToken } from "../../helpers/jwt";

export const registerAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists." });
    }

    const newAdmin = await Admin.create({ email, password });
    return res.status(201).json({ message: "Admin registered successfully.", admin: newAdmin });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isPasswordMatch = admin.password === password
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

      const token = generateAdminToken(admin)
    return res.status(200).json({ message: "Login successful.", token,admin });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

export const deactivateAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.status(200).json({ message: "Admin deactivated successfully.", admin });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

export const activateAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const admin = await Admin.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.status(200).json({ message: "Admin activated successfully.", admin });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

export const getAdminInfo = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing." });
  }

  try {
      const admin = await decodeAdminToken(token)
      
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res.status(200).json(admin);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token.", error });
  }
};