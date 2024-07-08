/**
 * @swagger
 * components:
 *   schemas:
 *     TrustMeterScale:
 *       type: number
 *       enum:
 *         - 0
 *         - 50
 *         - 80
 *         - 100
 *       description: The trust meter scale measured in increments.
 */
export enum TrustMeterScale {
  ZERO = 0,
  FIFTY = 50,
  EIGHTY = 80,
  HUNDRED = 100
}
