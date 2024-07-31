import { Request, Response } from 'express';
import MapCenter from '../models/MapCenter';

// Controller function to save or update the map center
export const saveMapCenter = async (req: Request, res: Response) => {
  const { pi_uid, latitude, longitude } = req.body;
  try {
    let mapCenter = await MapCenter.findOneAndUpdate(
      { pi_uid },
      { latitude, longitude },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Map center saved successfully', mapCenter });
  } catch (error) {
    console.error('Error saving map center:', error);
    res.status(500).json({ message: 'Error saving map center', error });
  }
};

// Controller function to retrieve the map center for a user
export const getMapCenter = async (req: Request, res: Response) => {
  const { pi_uid } = req.params;
  try {
    const mapCenter = await MapCenter.findOne({ pi_uid });
    if (!mapCenter) {
      return res.status(404).json({ message: 'Map center not found' });
    }
    res.status(200).json(mapCenter);
  } catch (error) {
    console.error('Error retrieving map center:', error);
    res.status(500).json({ message: 'Error retrieving map center', error });
  }
};
