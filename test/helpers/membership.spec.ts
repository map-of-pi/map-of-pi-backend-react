import { 
  isExpired,
  isOnlineShoppingClass,
  isOfflineShoppingClass,
  isSameShoppingClassType
} from  '../../src/helpers/membership';
import { MembershipClassType } from '../../src/models/enums/membershipClassType';

describe('isExpired function ', () => {
  it('should return true if the date is undefined', () => {
    expect(isExpired(undefined)).toBe(true);
  });

  it('should return true if the date is in the past', () => {
    const today = new Date();
    today.setMonth(today.getMonth() - 1); // 1 month in the past
    expect(isExpired(today)).toBe(true);
  });

  it('should return false if the date is in the future', () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 1); // 1 month in the future
    expect(isExpired(today)).toBe(false);
  });

  it('should return true if the date is today and slightly in the past', () => {
    const today = new Date(Date.now() - 10); // 10 ms in past
    expect(isExpired(today)).toBe(true);
  });

  it('should return false if the date is today and slightly in the future', () => {
    const today = new Date(Date.now() + 10); // 10 ms in future
    expect(isExpired(today)).toBe(false);
  });
});

describe('isOnlineShoppingClass function', () => {
  it('should return true for GREEN membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.GREEN)).toBe(true);
  });

  it('should return true for GOLD membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.GOLD)).toBe(true);
  });

  it('should return true for DOUBLE_GOLD membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.DOUBLE_GOLD)).toBe(true);
  });

  it('should return true for TRIPLE_GOLD membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.TRIPLE_GOLD)).toBe(true);
  });

  it('should return false for WHITE membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.WHITE)).toBe(false);
  });

  it('should return false for CASUAL membership tier', () => {
    expect(isOnlineShoppingClass(MembershipClassType.CASUAL)).toBe(false);
  });
});

describe('isOfflineShoppingClass function', () => {
  it('should return true for CASUAL membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.CASUAL)).toBe(true);
  });

  it('should return true for WHITE membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.WHITE)).toBe(true);
  });

  it('should return false for GREEN membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.GREEN)).toBe(false);
  });

  it('should return false for GOLD membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.GOLD)).toBe(false);
  });

  it('should return false for DOUBLE_GOLD membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.DOUBLE_GOLD)).toBe(false);
  });

  it('should return false for TRIPLE_GOLD membership tier', () => {
    expect(isOfflineShoppingClass(MembershipClassType.TRIPLE_GOLD)).toBe(false);
  });
});

describe('isSameShoppingClassType function', () => {
  it('should return true for two online shopping class tiers', () => {
    expect(isSameShoppingClassType(MembershipClassType.GREEN, MembershipClassType.GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GREEN, MembershipClassType.DOUBLE_GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GREEN, MembershipClassType.TRIPLE_GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GOLD, MembershipClassType.DOUBLE_GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GOLD, MembershipClassType.TRIPLE_GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.DOUBLE_GOLD, MembershipClassType.TRIPLE_GOLD)).toBe(true);
  });

  it('should return true for two offline shopping class tiers', () => {
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.WHITE)).toBe(true);
  });

  it('should return false for online shopping class vs offline shopping class tiers', () => {
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.GREEN)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.GOLD)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.DOUBLE_GOLD)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.TRIPLE_GOLD)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.WHITE, MembershipClassType.GREEN)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.WHITE, MembershipClassType.GOLD)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.WHITE, MembershipClassType.DOUBLE_GOLD)).toBe(false);
    expect(isSameShoppingClassType(MembershipClassType.WHITE, MembershipClassType.TRIPLE_GOLD)).toBe(false);
  });

  it('should return true for identical shopping class tiers', () => {
    expect(isSameShoppingClassType(MembershipClassType.CASUAL, MembershipClassType.CASUAL)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.WHITE, MembershipClassType.WHITE)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GREEN, MembershipClassType.GREEN)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.GOLD, MembershipClassType.GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.DOUBLE_GOLD, MembershipClassType.DOUBLE_GOLD)).toBe(true);
    expect(isSameShoppingClassType(MembershipClassType.TRIPLE_GOLD, MembershipClassType.TRIPLE_GOLD)).toBe(true);
  });
});