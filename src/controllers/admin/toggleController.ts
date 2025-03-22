import { Request, Response } from "express";
import * as toggleService from "../../services/admin/toggle.service";
import { IToggle } from "../../types";

import logger from "../../config/loggingConfig";

export const getToggles = async (req: Request, res: Response) => {
  try {
    const existingToggles = await toggleService.getToggles();
    logger.info(`Successfully fetched ${ existingToggles.length } toggles`);
    return res.status(200).json(existingToggles);
  } catch (error) {
    logger.error('Failed to get toggles', error);
    return res.status(500).json({ message: 'An error occurred while fetching toggles; please try again later' });
  }
};

export const getToggle = async (req: Request, res: Response) => {
  const { toggle_name } = req.params;
  try {
    const currentToggle = await toggleService.getToggleByName(toggle_name);
    if (!currentToggle) {
      logger.warn(`Toggle with identifier ${toggle_name} not found.`);
      return res.status(404).json({ message: "Toggle not found" });
    }
    logger.info(`Fetched toggle with identifier ${toggle_name}`);
    return res.status(200).json(currentToggle);
  } catch (error) {
    logger.error(`Failed to get toggle for identifier ${ toggle_name }:`, error);
    return res.status(500).json({ message: 'An error occurred while fetching toggle; please try again later' });
  }
};

export const addToggle = async (req: Request, res: Response) => {
  const { name, enabled, description } = req.body;
  try {
    const newToggle = await toggleService.addToggle({ name, enabled, description } as IToggle);
    logger.info(`Successfully added toggle with identifier ${name}`);
    return res.status(201).json({ message: "Toggle successfully added", newToggle });
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
    return res.status(200).json({ message: "Toggle successfully updated", updatedToggle });
  } catch (error) {
    logger.error(`Failed to update toggle for identifier ${ name }:`, error);
    return res.status(500).json({ message: 'An error occurred while updating toggle; please try again later' });
  }
};

export const deleteToggle = async (req: Request, res: Response) => {
  const { toggle_name } = req.params;
  try {
    const deletedToggle = await toggleService.deleteToggleByName(toggle_name);
    if (!deletedToggle) {
      logger.warn(`Toggle with identifier ${toggle_name} not found.`);
      return res.status(404).json({ message: "Toggle not found" });
    }
    logger.info(`Successfully deleted toggle with identifier ${toggle_name}`);
    return res.status(200).json({ message: "Toggle successfully deleted", deletedToggle });
  } catch (error) {
    logger.error(`Failed to delete toggle for identifier ${ toggle_name }:`, error);
    return res.status(500).json({ message: 'An error occurred while deleting toggle; please try again later' });
  }
};