/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterNewSellerRs:
 *       type: object
 *       properties:
 *         newSeller:
 *           type: object
 *           properties:
 *             seller_id:
 *               type: string
 *               example: test_seller_id
 *             name:
 *               type: string
 *               example: Test Seller
 *             description:
 *               type: string
 *               example: This is a sample seller description.
 *             image:
 *               type: string
 *               example: http://example.com/image.jpg
 *             address:
 *               type: string
 *               example: 1234 Test St, Test City, SC 12345
 *             sale_items:
 *               type: string
 *               example: Test Item 1, Test Item 2
 *             average_rating:
 *               type: object
 *               properties:
 *                 $numberDecimal:
 *                   type: string
 *                   example: "4.5"
 *               required:
 *                 - $numberDecimal
 *             trust_meter_rating:
 *               type: object
 *               $ref: '#/components/schemas/TrustMeterScale'
 *             coordinates:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: Point
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                     example:
 *                       - 125.6
 *                       - 10.1
 *               required:
 *                 - type
 *                 - coordinates
 *             order_online_enabled_pref:
 *               type: boolean
 *               example: true
 *             _id:
 *               type: string
 *               example: "666c8c2eac7df1b07197b5dd"
 *             __v:
 *               type: number
 *               example: 0
 *           required:
 *             - seller_id
 *             - name
 *             - description
 *             - average_rating
 *             - trust_meter_rating
 *             - order_online_enabled_pref
 *             - _id
 *             - __v
 *       required:
 *         - newSeller
 */
