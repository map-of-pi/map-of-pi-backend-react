/**
 * @swagger
 * components:
 *   schemas:
 *     AuthenticateUserRq:
 *       type: object
 *       properties:
 *         auth:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "user_id"
 *                 username:
 *                   type: string
 *                   example: "user_id"
 *               required:
 *                 - uid
 *                 - username
 *           required:
 *             - user
 *       required:
 *         - auth
 */
