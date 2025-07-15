import membershipData from '../../utils/membership.json';

export interface MembershipTier {
  CLASS: string;
  LABEL: string;
  COST: number;
  DURATION: number; // in weeks
  RANK: number; // 1-6, where 1 is the lowest tier and 6 is the highest
}

export type MembershipTierKey =
  | 'TIER1'
  | 'TIER2'
  | 'TIER3'
  | 'TIER4'
  | 'TIER5'
  | 'TIER6';

export enum MembershipTierEnum {
  TIER1 = 'TIER1',
  TIER2 = 'TIER2',
  TIER3 = 'TIER3',
  TIER4 = 'TIER4',
  TIER5 = 'TIER5',
  TIER6 = 'TIER6',
}

export type MembershipTiersMap = Record<MembershipTierKey, MembershipTier>;

export const membershipTiers: MembershipTiersMap = membershipData
