import { Request, Response } from "express";
import * as adminService from "../../services/admin.service";
import logger from "../../config/loggingConfig";

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { admin, token } = await adminService.loginAdmin(email, password);
    return res.status(200).json({ message: "Admin logged in successfully.", token, admin });
  } catch (error: any) {
    if (error.message === "Admin not found.") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Invalid credentials.") {
      return res.status(401).json({ message: error.message });
    }

    logger.error('Failed to login admin', error);
    return res.status(500).json({
      message: 'An error occurred while logging in admin; please try again later',
    });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await adminService.registerAdmin(email, password);
    return res.status(201).json({ message: "Admin registered successfully.", admin });
  } catch (error: any) {
    if (error.message === "Admin already exists.") {
      return res.status(400).json({ message: error.message });
    }

    logger.error('Failed to register admin', error);
    return res.status(500).json({
      message: 'An error occurred while registering admin; please try again later',
    });
  }
};

export const getAdminInfo = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ message: "Authorization token missing." });
  }

  try {
    const admin = await adminService.getAdminInfoByToken(token);
    return res.status(200).json(admin);
  } catch (error: any) {
    if (error.message === "Admin not found.") {
      return res.status(404).json({ message: error.message });
    }

    logger.error('Failed to fetch admin info', error);
    return res.status(500).json({
      message: 'An error occurred while fetching admin info; please try again later',
    });
  }
};

export const activateAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const admin = await adminService.activateAdminById(id);
    return res.status(200).json({ message: "Admin activated successfully.", admin });
  } catch (error: any) {
    if (error.message === "Admin not found.") {
      return res.status(404).json({ message: error.message });
    }
    
    logger.error('Failed to activate admin', error);
    return res.status(500).json({
      message: 'An error occurred while activating admin; please try again later',
    });
  }
};

export const deactivateAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const admin = await adminService.deactivateAdminById(id);
    return res.status(200).json({ message: "Admin deactivated successfully.", admin });
  } catch (error: any) {
    if (error.message === "Admin not found.") {
      return res.status(404).json({ message: error.message });
    }
    
    logger.error('Failed to deactivate admin', error);
    return res.status(500).json({
      message: 'An error occurred while deactivating admin; please try again later',
    });
  }
};
