export enum MembershipClassType {
  CASUAL = "Casual",
  MEMBER = "Member",
  GREEN = "Green",
  GOLD = "Gold",
  DOUBLE_GOLD = "Double Gold",
  TRIPLE_GOLD = "Triple Gold",
}

// Used for rank-based comparisons (upgrade/downgrade/etc)
export const tierRank: Record<MembershipClassType, number> = {
  [MembershipClassType.CASUAL]: 0,
  [MembershipClassType.MEMBER]: 1,
  [MembershipClassType.GREEN]: 2,
  [MembershipClassType.GOLD]: 3,
  [MembershipClassType.DOUBLE_GOLD]: 4,
  [MembershipClassType.TRIPLE_GOLD]: 5,
};