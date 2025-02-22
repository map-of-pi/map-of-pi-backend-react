export enum VisibleSellerType {
  Active = 'activeSeller',
  Test = 'testSeller'
}

enum InvisibleSellerType {
  Inactive = 'inactiveSeller'
}

export const SellerType = Object.assign({}, VisibleSellerType, InvisibleSellerType);
export type SellerType = VisibleSellerType | InvisibleSellerType;

export enum FulfillmentType {
  CollectionByBuyer = 'Collection by buyer',
  DeliveredToBuyer = 'Delivered to buyer'
}