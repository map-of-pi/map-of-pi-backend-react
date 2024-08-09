import { Request, Response } from 'express';

import * as mapCenterService from '../services/mapCenter.service'; 
import { IMapCenter } from '../types';

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const saveMapCenter = async (req: Request, res: Response) => {
  let authUser =req.currentUser;
  try {  
    if (authUser){    
      const pi_uid = authUser.pi_uid;
      const { latitude, longitude } = req.body;
      const mapCenter = await mapCenterService.createOrUpdateMapCenter(pi_uid, latitude, longitude);
      return res.status(200).json({ message: 'Map center saved successfully', mapCenter });
    } else {
      return res.status(404).json({ message: "User not found; save Map Center unsuccessfull" })
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  } 
};

export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const pi_uid = req.currentUser?.pi_uid;
    if (pi_uid) {
      const mapCenter: IMapCenter | null = await mapCenterService.getMapCenterById(pi_uid);
      if (!mapCenter) {
        return res.status(404).json({ message: 'Map center not found.' });
      }
      return res.status(200).json({ mapCenter });
    }
  } catch (error: any) {
      res.status(500).json({ message: error.message });
  }
};
