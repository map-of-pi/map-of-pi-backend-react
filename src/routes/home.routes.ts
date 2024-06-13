import { Router } from "express";

const homeRoutes = Router()

homeRoutes.get("/", (req, res) => {
    res.status(200).json({
        message:"server is running"
    })
})

export default homeRoutes
