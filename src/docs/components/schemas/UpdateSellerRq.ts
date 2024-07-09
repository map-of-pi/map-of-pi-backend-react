/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateSellerRq:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Test Seller
 *         description:
 *           type: string
 *           example: This is a sample seller description.
 *         image:
 *           type: string
 *           example: http://example.com/image.jpg
 *         address:
 *           type: string
 *           example: 1234 Test St, Test City, SC 12345
 *         sale_items:
 *           type: string
 *           example: Test Item 1, Test Item 2
 *         coordinates:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *                 example:
 *                   - 125.6
 *                   - 10.1
 *           required:
 *             - type
 *             - coordinates
 *         order_online_enabled_pref:
 *           type: boolean
 *           example: true
 *       optional:
 *         - name
 *         - description
 *         - image
 *         - address
 *         - sale_items
 *         - coordinates
 *         - order_online_enabled_pref
 */
