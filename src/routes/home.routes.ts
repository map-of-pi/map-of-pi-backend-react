import { Router } from "express";

const homeRoutes = Router()

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get server status
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: Successful response | Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server is running
 *       500:
 *         description: Internal server error
 */
homeRoutes.get("/", (req, res) => {
    res.status(200).json({
        message:"Server is running"
    })
})

export default homeRoutes
