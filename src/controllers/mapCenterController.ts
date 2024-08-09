import { Request, Response } from 'express';

import * as mapCenterService from '../services/mapCenter.service'; 
import { IMapCenter } from '../types';

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const saveMapCenter = async (req: Request, res: Response) => {
  try {
    const { pi_uid, latitude, longitude } = req.body;
    const mapCenter = await mapCenterService.createOrUpdateMapCenter(pi_uid, latitude, longitude);
    res.status(200).json({ message: 'Map center saved successfully', mapCenter });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  } 
};

export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const { pi_uid } = req.params;
    const mapCenter: IMapCenter | null = await mapCenterService.getMapCenterById(pi_uid);
    if (!mapCenter) {
      return res.status(404).json({ message: 'Map center not found.' });
    }
    res.status(200).json(mapCenter);
  } catch (error: any) {
      res.status(500).json({ message: error.message });
  }
};
