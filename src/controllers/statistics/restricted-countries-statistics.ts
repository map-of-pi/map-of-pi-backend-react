import { Request, Response } from "express";
import SanctionedRegion from "../../models/misc/SanctionedRegion";


export const getRestrictedAreaStats = async (req: Request, res: Response) => {
    try {
        const restrictedAreas = await SanctionedRegion.find()
        return res.status(200).json({
            restrictedAreas
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching restricted areas",
            error: error
        });
    }
}

export const createSanctionedRegion = async (req: Request, res: Response) => {
    try {
        const { location, boundary } = req.body;

        const newSanctionedRegion = await SanctionedRegion.create({
            location,
            boundary: {
                type: "Polygon",
                coordinates: boundary
            }
        });

        return res.status(201).json({
            success: true,
            message: "Sanctioned region created successfully",
            data: newSanctionedRegion
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating sanctioned region",
            error: error
        });
    }
}