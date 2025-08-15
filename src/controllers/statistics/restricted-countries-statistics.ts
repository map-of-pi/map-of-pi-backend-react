import { Request, Response } from "express";
import SanctionedGeoBoundary from "../../models/misc/SanctionedGeoBoundary";

export const getRestrictedAreaStats = async (req: Request, res: Response) => {
    try {
        const restrictedAreas = await SanctionedGeoBoundary.find()
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
        const { geometry, properties } = req.body;

        const newSanctionedRegion = await SanctionedGeoBoundary.create({
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: geometry.coordinates
            },
            properties: {
                shapeName: properties.shapeName,
                shapeISO: properties.shapeISO,
                shapeID: properties.shapeID,
                shapeGroup: properties.shapeGroup,
                shapeType: properties.shapeType
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