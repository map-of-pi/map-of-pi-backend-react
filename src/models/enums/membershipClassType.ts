export enum MembershipClassType {
  CASUAL = "Casual",
  SINGLE = "Single",
  WHITE = "White",
  GREEN = "Green",
  GOLD = "Gold",
  DOUBLE_GOLD = "Double Gold",
  TRIPLE_GOLD = "Triple Gold",
}

export const membershipTiers = {
  tier0: {
    CLASS: MembershipClassType.CASUAL,
    MAPPI_ALLOWANCE: 0,
    COST: 0,
    DURATION: null,
    RANK: 0
  },
  tier1: {
    CLASS: MembershipClassType.SINGLE,
    MAPPI_ALLOWANCE: 10,
    COST: 0.2,
    DURATION: 2,
    RANK: 1
  },
  tier2: {
    CLASS: MembershipClassType.WHITE,
    MAPPI_ALLOWANCE: 0,
    COST: 1,
    DURATION: 50,
    RANK: 2
  },
  tier3: {
    CLASS: MembershipClassType.GREEN,
    MAPPI_ALLOWANCE: 20,
    COST: 1.5,
    DURATION: 4,
    RANK: 3
  },
  tier4: {
    CLASS: MembershipClassType.GOLD,
    MAPPI_ALLOWANCE: 100,
    COST: 5,
    DURATION: 10,
    RANK: 4
  },
  tier5: {
    CLASS: MembershipClassType.DOUBLE_GOLD,
    MAPPI_ALLOWANCE: 400,
    COST: 10,
    DURATION: 20,
    RANK: 5
  },
  tier6: {
    CLASS: MembershipClassType.TRIPLE_GOLD,
    MAPPI_ALLOWANCE: 2000,
    COST: 20,
    DURATION: 50,
    RANK: 6
  }
}