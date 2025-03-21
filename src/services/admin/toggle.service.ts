import Toggle from "../../models/misc/Toggle";
import { IToggle } from "../../types";

import logger from "../../config/loggingConfig";

export const getToggleByName = async (name: string): Promise<IToggle | null> => {
  try {
    const toggle = await Toggle.findOne({ name }).exec();    
    return toggle ? toggle as IToggle : null;
  } catch (error) {
    logger.error(`Failed to retrieve toggle with identifier ${ name }:`, error);
    throw new Error('Failed to get toggle; please try again later');
  }
};

export const addToggle = async (toggleData: IToggle): Promise<IToggle> => {
  try {
    // Check if a toggle with the same name already exists
    const existingToggle = await Toggle.findOne({ name: toggleData.name }).exec();
    if (existingToggle) {
      throw new Error(`A toggle with the identifier ${toggleData.name} already exists.`);
    }

    // Create the new toggle instance
    const newToggle = new Toggle({
      ...toggleData
    });
    const savedToggle = await newToggle.save();
    return savedToggle as IToggle;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      throw error;
    }
    logger.error('Failed to add toggle:', error);
    throw new Error('Failed to add toggle; please try again later');
  }
};

export const updateToggle = async (
  name: string, 
  enabled: boolean, 
  description?: string
): Promise<IToggle> => {
  try {
    const updateData: any = { enabled };

    // Only update the description if it's provided and not an empty string
    if (description !== undefined && description !== '') {
      updateData.description = description;
    }

    // Find and update the toggle by name
    const updatedToggle = await Toggle.findOneAndUpdate(
      { name },
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updatedToggle) {
      throw new Error(`A toggle with the identifier ${name} does not exist.`);
    }

    logger.info('Toggle updated in the database:', updatedToggle);
    return updatedToggle as IToggle;
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    logger.error('Failed to update toggle:', error);
    throw new Error('Failed to update toggle; please try again later');
  }
};

