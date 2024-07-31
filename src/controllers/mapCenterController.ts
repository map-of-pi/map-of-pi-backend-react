import { Request, Response } from 'express';
import MapCenter from '../models/MapCenter';

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const saveMapCenter = async (req: Request, res: Response) => {
  const { pi_uid, latitude, longitude } = req.body;
  try {
    if (!pi_uid || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let mapCenter = await MapCenter.findOneAndUpdate(
      { pi_uid },
      { latitude, longitude },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Map center saved successfully', mapCenter });
  } catch (error) {
    if (isError(error)) {
      console.error('Error saving map center:', error.message);
      res.status(500).json({ message: 'Error saving map center', error: error.message });
    } else {
      console.error('Unknown error occurred while saving map center');
      res.status(500).json({ message: 'Unknown error occurred while saving map center' });
    }
  }
};

export const getMapCenter = async (req: Request, res: Response) => {
  const { pi_uid } = req.params;
  try {
    if (!pi_uid) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const mapCenter = await MapCenter.findOne({ pi_uid });
    if (!mapCenter) {
      return res.status(404).json({ message: 'Map center not found' });
    }
    res.status(200).json(mapCenter);
  } catch (error) {
    if (isError(error)) {
      console.error('Error retrieving map center:', error.message);
      res.status(500).json({ message: 'Error retrieving map center', error: error.message });
    } else {
      console.error('Unknown error occurred while retrieving map center');
      res.status(500).json({ message: 'Unknown error occurred while retrieving map center' });
    }
  }
};
