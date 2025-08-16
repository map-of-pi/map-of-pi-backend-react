import { Types } from "mongoose";
import Membership from "../../src/models/Membership";
import User from "../../src/models/User";
import { 
  mappiCreditOptions, 
  MappiCreditType, 
  MembershipClassType, 
  membershipTiers
} from "../../src/models/enums/membershipClassType";
import { 
  buildMembershipList, 
  getSingleMembershipById, 
  getUserMembership, 
  updateMappiBalance
} from "../../src/services/membership.service";
import { IMembership } from "../../src/types";

jest.mock('../../src/models/Membership');
jest.mock('../../src/models/User');

describe('buildMembershipList function', () => {
  it('should include single Mappi purchase option at the top of the membership list', async () => {
    const membershipList = await buildMembershipList();

    expect(membershipList[0].value).toBe(MappiCreditType.SINGLE);
    expect(membershipList[0].cost).toBe(mappiCreditOptions.COST);
    expect(membershipList[0].duration).toBe(mappiCreditOptions.DURATION);
    expect(membershipList[0].mappi_allowance).toBe(mappiCreditOptions.MAPPI_ALLOWANCE);
  });

  it('should include all membership tiers except CASUAL', async () => {
    const membershipList = await buildMembershipList();

    const filteredMembershipTiers = Object.values(membershipTiers)
      .filter(tier => tier.CLASS !== MembershipClassType.CASUAL)
      .map(tier => tier.CLASS);
    
    const membershipClasses = membershipList.slice(1).map(item => item.value);

    expect(membershipClasses).toEqual(expect.arrayContaining(filteredMembershipTiers));
    expect(membershipClasses).not.toContain(MembershipClassType.CASUAL);
  });

  it('should sort membership tiers by rank', async () => {
    const membershipList = await buildMembershipList();

    const membershipRanks = membershipList.slice(1).map(item => {
      return Object.values(membershipTiers).find(t => t.CLASS === item.value)?.RANK ?? 0;
    });
    const sortedMembershipRanks = [...membershipRanks].sort((a, b) => a - b);
    expect(membershipRanks).toEqual(sortedMembershipRanks);
  });

  it('should assign correct data for applicable purchase options', async () => {
    const membershipList = await buildMembershipList();

    // Single Mappi
    expect(membershipList[0].value).toBe(mappiCreditOptions.CLASS);
    expect(membershipList[0].cost).toBe(mappiCreditOptions.COST);
    expect(membershipList[0].duration).toBe(mappiCreditOptions.DURATION ?? null);
    expect(membershipList[0].mappi_allowance).toBe(mappiCreditOptions.MAPPI_ALLOWANCE ?? 0);

    // Applicable Membership Tiers
    membershipList.slice(1).forEach(item => {
      const tier = Object.values(membershipTiers).find(t => t.CLASS === item.value);
      expect(item.value).toBe(tier?.CLASS ?? 0);
      expect(item.cost).toBe(tier?.COST ?? 0);
      expect(item.duration).toBe(tier?.DURATION ?? null);
      expect(item.mappi_allowance).toBe(tier?.MAPPI_ALLOWANCE ?? 0);
    });
  });

  it('should throw an error if building membership list fails', async () => {
    const mockError = new Error('Unexpected error');
    const original = Object.values;

    Object.values = jest.fn(() => { throw mockError; });

    await expect(buildMembershipList()).rejects.toThrow('Unexpected error');

    Object.values = original; // restore original
  });
});

describe('getUserMembership function', () => {
  const authUser = { pi_uid: 'piUID_TEST' } as any;
  const mockUser = { _id: '_id_TEST' } as any;

  it('should return the user membership if found', async () => {
    const mockMembership = { 
      user_id: new Types.ObjectId(),
      pi_uid: authUser.pi_uid,
      membership_class: MembershipClassType.GOLD,
      mappi_balance: 100,
      membership_expiry_date: new Date(),
      mappi_used_to_date: new Date(),
    } as unknown as IMembership;

    (Membership.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockMembership),
    });

    const result = await getUserMembership(authUser);

    expect(Membership.findOne).toHaveBeenCalledWith({ pi_uid: authUser.pi_uid });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(result).toEqual(mockMembership);
  });

  it('should create a new membership [CASUAL] if no existing membership exists', async () => {
    (Membership.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    (User.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    });

    const saveMock = jest.fn().mockResolvedValue({
      toObject: () => ({
        user_id: mockUser._id,
        pi_uid: authUser.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        membership_expiry_date: null,
        mappi_balance: 0,
        mappi_used_to_date: 0,
      }),
    });
    (Membership as any).mockImplementation(() => ({ save: saveMock }));

    const result = await getUserMembership(authUser);

    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: authUser.pi_uid });
    expect(Membership).toHaveBeenCalledWith({
      user_id: mockUser._id,
      pi_uid: authUser.pi_uid,
      membership_class: MembershipClassType.CASUAL,
      membership_expiry_date: null,
      mappi_balance: 0,
      mappi_used_to_date: 0,
    });
    expect(saveMock).toHaveBeenCalled();

    expect(result.user_id).toBe('_id_TEST');
    expect(result.pi_uid).toBe('piUID_TEST');
    expect(result.membership_class).toBe(MembershipClassType.CASUAL);
    expect(result.membership_expiry_date).toBe(null);
    expect(result.mappi_balance).toBe(0);
    expect(result.mappi_used_to_date).toBe(0);
  });

  it('should create a new membership [CASUAL] if no existing user exists', async () => {
    (Membership.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    (User.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const saveMock = jest.fn().mockResolvedValue({
      toObject: () => ({
        user_id: undefined,
        pi_uid: authUser.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        membership_expiry_date: null,
        mappi_balance: 0,
        mappi_used_to_date: 0,
      }),
    });
    (Membership as any).mockImplementation(() => ({ save: saveMock }));

    const result = await getUserMembership(authUser);

    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: authUser.pi_uid });
    expect(Membership).toHaveBeenCalledWith({
      user_id: undefined,
      pi_uid: authUser.pi_uid,
      membership_class: MembershipClassType.CASUAL,
      membership_expiry_date: null,
      mappi_balance: 0,
      mappi_used_to_date: 0,
    });
    expect(saveMock).toHaveBeenCalled();

    expect(result.user_id).toBeUndefined();
    expect(result.pi_uid).toBe('piUID_TEST');
    expect(result.membership_class).toBe(MembershipClassType.CASUAL);
    expect(result.membership_expiry_date).toBe(null);
    expect(result.mappi_balance).toBe(0);
    expect(result.mappi_used_to_date).toBe(0);
  });

  it('should throw an error if getting user membership fails', async () => {
    const mockError = new Error('Mock database error');

    (Membership.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockRejectedValue(mockError),
    });

    await expect(getUserMembership(authUser)).rejects.toThrow('Mock database error');
    
    expect(User.findOne).not.toHaveBeenCalled();
  });
});

describe('getSingleMembershipById function', () => {
  const membership_id = 'membershipID_TEST';

  it('should return a single membership if found', async () => {
    const mockMembership = {
      _id: membership_id, 
      user_id: new Types.ObjectId(),
      pi_uid: 'piUID_TEST',
      membership_class: MembershipClassType.GOLD,
      mappi_balance: 100,
      membership_expiry_date: new Date(),
      mappi_used_to_date: new Date(),
    } as unknown as IMembership;

    (Membership.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockMembership),
    });

    const result = await getSingleMembershipById(membership_id);

    expect(result).toEqual(mockMembership);
    expect(Membership.findById).toHaveBeenCalledWith(membership_id);
  });

  it('should return null when single membership not found', async () => {
    (Membership.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const result = await getSingleMembershipById(membership_id);

    expect(result).toBeNull();
    expect(Membership.findById).toHaveBeenCalledWith(membership_id);
  });

  it('should throw an error if getting single membership fails', async () => {
    const mockError = new Error('Mock database error');

    (Membership.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockRejectedValue(mockError),
    });

    await expect(getSingleMembershipById(membership_id))
      .rejects.toThrow('Mock database error');
    
    expect(Membership.findById).toHaveBeenCalledWith(membership_id);
  });
});

describe('updateMappiBalance function', () => {
  const pi_uid = 'piUID_TEST';
  const amount = 10;

  const mockMembership = {
    user_id: new Types.ObjectId(),
    pi_uid,
    membership_class: MembershipClassType.GOLD,
    mappi_balance: 100,
    membership_expiry_date: new Date(),
    mappi_used_to_date: new Date(),
  } as unknown as IMembership;

  it('should update the Mappi balance successfully', async () => {
    (Membership.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...mockMembership, mappi_balance: 110 }),
    });

    const result = await updateMappiBalance(pi_uid, amount);

    expect(result).toEqual({...mockMembership, mappi_balance: 110 });
    expect(Membership.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_uid },
      { $inc: { mappi_balance: amount } },
      { new: true }
    );
  });

  it('should throw an error if membership is not found', async () => {
    (Membership.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(updateMappiBalance(pi_uid, amount)).rejects.toThrow(
      'Membership not found'
    );

    expect(Membership.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_uid },
      { $inc: { mappi_balance: amount } },
      { new: true }
    );
  });

  it('should throw an error if updating Mappi balance fails', async () => {
    const mockError = new Error('Mock database error');

    (Membership.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(mockError),
    });

    await expect(updateMappiBalance(pi_uid, amount))
      .rejects.toThrow('Mock database error');
    
    expect(Membership.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_uid },
      { $inc: { mappi_balance: amount } },
      { new: true }
    );
  });
});