
import { StockLevelType } from "../models/enums/stockLevelType";

export class StockValidationError extends Error {
  constructor(message: string, public itemId?: string) {
    super(message);
    this.name = 'StockValidationError';
  }
}

export function getUpdatedStockLevel(
  currentLevel: StockLevelType,
  quantity: number,
  itemId: string
): StockLevelType | null {
  switch (currentLevel) {
    case StockLevelType.AVAILABLE_1:
      if (quantity > 1) throw new StockValidationError('Cannot order more than 1 item for "1 available"', itemId);
      return StockLevelType.SOLD;

    case StockLevelType.AVAILABLE_2:
      if (quantity > 2) throw new StockValidationError('Cannot order more than 2 items for "2 available"', itemId);
      return quantity === 2 ? StockLevelType.SOLD : StockLevelType.AVAILABLE_1;

    case StockLevelType.AVAILABLE_3:
      if (quantity > 3) throw new StockValidationError('Cannot order more than 3 items for "3 available"', itemId);
      return quantity === 3
        ? StockLevelType.SOLD
        : quantity === 2
        ? StockLevelType.AVAILABLE_1
        : StockLevelType.AVAILABLE_2;

    case StockLevelType.MANY_AVAILABLE:
    case StockLevelType.MADE_TO_ORDER:
    case StockLevelType.ONGOING_SERVICE:
      return null; // No update needed

    default:
      throw new StockValidationError(`Unhandled stock level type`, itemId);
  }
}

export function getRollbackStockLevel(
  currentStock: StockLevelType,
  quantity: number
): StockLevelType | null {
  switch (currentStock) {
    case StockLevelType.SOLD:
      if (quantity === 1) return StockLevelType.AVAILABLE_1;
      if (quantity === 2) return StockLevelType.AVAILABLE_2;
      if (quantity === 3) return StockLevelType.AVAILABLE_3;
      break;

    case StockLevelType.AVAILABLE_1:
      if (quantity === 1) return StockLevelType.AVAILABLE_2;
      else if (quantity === 2) return StockLevelType.AVAILABLE_3;
      break;

    case StockLevelType.AVAILABLE_2:
      if (quantity === 1) return StockLevelType.AVAILABLE_3;
      break;

    // For non-limited stock types, we assume no rollback is needed
    case StockLevelType.MANY_AVAILABLE:
    case StockLevelType.MADE_TO_ORDER:
    case StockLevelType.ONGOING_SERVICE:
      return null;

    default:
      return null;
  }

  return null;
}
