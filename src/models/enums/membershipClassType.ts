export enum MembershipClassType {
  CASUAL = "Casual",
  SINGLE = "Single",
  WHITE = "White",
  GREEN = "Green",
  GOLD = "Gold",
  DOUBLE_GOLD = "Double_Gold",
  TRIPLE_GOLD = "Triple_Gold",
}

export const membershipTiers = {
  Single: {
    MAPPI_ALLOWANCE: 10,
    COST: 0.2,
    DURATION: 2,
    RANK: 1
  },
  White: {
    MAPPI_ALLOWANCE: 20,
    COST: 1,
    DURATION: 3,
    RANK: 2
  },
  Green: {
    MAPPI_ALLOWANCE: 50,
    COST: 1.5,
    DURATION: 4,
    RANK: 3
  },
  Gold: {
    MAPPI_ALLOWANCE: 100,
    COST: 5,
    DURATION: 10,
    RANK: 4
  },
  Double_Gold: {
    MAPPI_ALLOWANCE: 200,
    COST: 10,
    DURATION: 20,
    RANK: 5
  },
  Triple_Gold: {
    MAPPI_ALLOWANCE: 300,
    COST: 20,
    DURATION: 50,
    RANK: 6
  }
}
