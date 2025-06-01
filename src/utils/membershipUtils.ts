import { MembershipClassType } from "../models/enums/membershipClassType";

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