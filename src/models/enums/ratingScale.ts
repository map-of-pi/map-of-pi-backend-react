/**
 * @swagger
 * components:
 *   schemas:
 *     RatingScale:
 *       type: number
 *       enum:
 *         - 0
 *         - 2
 *         - 3
 *         - 4
 *         - 5
 *       description: The rating scale where 0 is DESPAIR | 2 is SAD | 3 is OKAY | 4 is HAPPY | 5 is DELIGHT.
 */
export enum RatingScale {
  DESPAIR = 0,
  SAD = 2,
  OKAY = 3,
  HAPPY = 4,
  DELIGHT = 5
}
