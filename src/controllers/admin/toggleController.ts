import { Request, Response } from "express";
import * as toggleService from "../../services/admin/toggle.service";
import { IToggle } from "../../types";

import logger from "../../config/loggingConfig";

export const getToggle = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const currentToggle = await toggleService.getToggleByName(name);
    if (!currentToggle) {
      logger.warn(`Toggle with identifier ${name} not found.`);
      return res.status(404).json({ message: "Toggle not found" });
    }
    logger.info(`Fetched toggle with identifier ${name}`);
    return res.status(200).json(currentToggle);
  } catch (error) {
    logger.error(`Failed to get toggle for identifier ${ name }:`, error);
    return res.status(500).json({ message: 'An error occurred while fetching toggle; please try again later' });
  }
};

export const addToggle = async (req: Request, res: Response) => {
  const { name, enabled, description } = req.body;
  try {
    const newToggle = await toggleService.addToggle({ name, enabled, description } as IToggle);
    logger.info(`Successfully added toggle with identifier ${name}`);
    return res.status(201).json(newToggle);
  } catch (error) {
    logger.error(`Failed to add toggle for identifier ${ name }:`, error);
    return res.status(500).json({ message: 'An error occurred while adding toggle; please try again later' });
  }
};

export const updateToggle = async (req: Request, res: Response) => {
  const { name, enabled, description } = req.body;
  try {
    const updatedToggle = await toggleService.updateToggle(name, enabled, description);
    logger.info(`Successfully updated toggle with identifier ${name}`);
    return res.status(200).json(updatedToggle);
  } catch (error) {
    logger.error(`Failed to update toggle for identifier ${ name }:`, error);
    return res.status(500).json({ message: 'An error occurred while updating toggle; please try again later' });
  }
};