import { MembershipClassType } from "../models/enums/membershipClassType";

// Check if new tier is lower than the current one (i.e. a downgrade)
export function isTierDowngrade(
  oldTier: MembershipClassType,
  newTier: MembershipClassType
): boolean {
  const tierOrder: MembershipClassType[] = [
    MembershipClassType.WHITE,
    MembershipClassType.CASUAL,
    MembershipClassType.MEMBER,
    MembershipClassType.GREEN,
    MembershipClassType.GOLD,
    MembershipClassType.DOUBLE_GOLD,
    MembershipClassType.TRIPLE_GOLD,
  ];

  return tierOrder.indexOf(newTier) < tierOrder.indexOf(oldTier);
}

// Check if switching between online instore
export function isSwitchingBetweenTypes(
  oldTier: MembershipClassType,
  newTier: MembershipClassType
): boolean {
  const onlineTiers = [
    MembershipClassType.MEMBER,
    MembershipClassType.GREEN,
    MembershipClassType.GOLD,
    MembershipClassType.DOUBLE_GOLD,
    MembershipClassType.TRIPLE_GOLD,
  ];

  const instoreTiers = [
    MembershipClassType.WHITE,
    MembershipClassType.CASUAL,
  ];

  const wasOnline = onlineTiers.includes(oldTier);
  const nowInstore = instoreTiers.includes(newTier);
  const wasInstore = instoreTiers.includes(oldTier);
  const nowOnline = onlineTiers.includes(newTier);

  return (wasOnline && nowInstore) || (wasInstore && nowOnline);
}
