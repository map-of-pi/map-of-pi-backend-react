import mongoose from 'mongoose';
import Membership from '../../src/models/Membership';
import User from '../../src/models/User';
import { MembershipClassType } from '../../src/models/enums/membershipClassType';
import { TransactionType } from '../../src/models/enums/transactionType';
import { 
  getSingleMembershipById,
  addOrUpdateMembership,
  updateMappiBalance 
} from '../../src/services/membership.service';
import { IUser, IMembership } from '../../src/types';

describe('getSingleMembershipById function', () => {
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToPlainObject = (membership: IMembership): any => {
    const plainObject = membership.toObject();

    if (plainObject.membership_expiry_date instanceof Date) {
      plainObject.membership_expiry_date = plainObject.membership_expiry_date.toISOString();
    }
    
    return plainObject;
  };

  it('should return existing membership associated with the membership ID', async () => {
    const testMembership = await Membership.create({
      user: new mongoose.Types.ObjectId(),
      membership_id: '0a0a0a-0a0a-0a0a',
      membership_class: MembershipClassType.TRIPLE_GOLD,
      membership_expiry_date: new Date('2026-01-26T00:00:00.000Z'),
      mappi_balance: 1000,
      mappi_used_to_date: 0,
      payment_history: [],
    });
  
    const membershipData = await getSingleMembershipById('0a0a0a-0a0a-0a0a') as IMembership;
  
    const plainObject = membershipData.toObject();
    plainObject.membership_expiry_date = plainObject.membership_expiry_date.toISOString();
  
    expect(plainObject).toMatchObject({
      membership_id: '0a0a0a-0a0a-0a0a',
      membership_class: "Triple Gold",
      membership_expiry_date: "2026-01-26T00:00:00.000Z",
      mappi_balance: 1000
    });
  });
  

  it('should throw an error when an exception occurs', async () => {  
    // Mock the Membership model to throw an error
    jest.spyOn(Membership, 'findOne').mockImplementationOnce(() => {
      throw new Error('Unexpected exception occurred');
    });

    await expect(getSingleMembershipById('0d0d0d-0d0d-0d0d')).rejects.toThrow(
      'Failed to get membership; please try again later'
    );
  });
});


describe('addOrUpdateMembership function', () => {
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      endSession: jest.fn()
    };

    jest.spyOn(Membership, 'startSession').mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Reset mocks after each test
  });

  it('should build new membership if it does not exist for the Pioneer', async () => {
    const fakeUser = { pi_uid: '0e0e0e-0e0e-0e0e' } as IUser;

    jest.spyOn(Membership, 'findOne').mockReturnValueOnce({
      session: () => ({
        exec: () => Promise.resolve(null)
      })
    } as any);

    const saveMock = jest.fn().mockResolvedValue({
      membership_id: fakeUser.pi_uid,
      membership_class: MembershipClassType.MEMBER,
      membership_expiry_date: expect.any(Date),
      mappi_balance: 5
    });

    jest.spyOn(Membership.prototype, 'save').mockImplementation(saveMock);

    const result = await addOrUpdateMembership(
      fakeUser,
      MembershipClassType.MEMBER,
      2,
      5
    );

    expect(result).toMatchObject({
      membership_id: fakeUser.pi_uid,
      membership_class: MembershipClassType.MEMBER,
      mappi_balance: 5
    });

    expect(saveMock).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should update existing membership if it does exist for the Pioneer', async () => {
    const fakeUser = { pi_uid: '0b0b0b-0b0b-0b0b' } as IUser;

    const fakeMembership: any = {
      membership_id: fakeUser.pi_uid,
      membership_class: MembershipClassType.MEMBER,
      membership_expiry_date: new Date(),
      mappi_balance: 100,
      save: jest.fn().mockResolvedValue({
        membership_id: fakeUser.pi_uid,
        membership_class: MembershipClassType.TRIPLE_GOLD,
        membership_expiry_date: expect.any(Date),
        mappi_balance: 2100
      })
    };

    jest.spyOn(Membership, 'findOne').mockReturnValueOnce({
      session: () => ({
        exec: () => Promise.resolve(fakeMembership)
      })
    } as any);

    const result = await addOrUpdateMembership(
      fakeUser,
      MembershipClassType.TRIPLE_GOLD,
      50,
      2000
    );

    expect(fakeMembership.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      membership_id: fakeUser.pi_uid,
      membership_class: MembershipClassType.TRIPLE_GOLD,
      mappi_balance: 2100
    });

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should throw an error when an exception occurs', async () => {
    const fakeUser = { pi_uid: '0x0x0x-0x0x-0x0x' } as IUser;

    jest.spyOn(Membership, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock failure');
    });

    await expect(
      addOrUpdateMembership(fakeUser, MembershipClassType.MEMBER, 1, 10)
    ).rejects.toThrow('Failed to add or update membership; please try again later');
  });
});

describe('updateMembershipBalance function', () => {
  beforeEach(async () => {
    await Membership.deleteMany({});
  });

  it('should add to membership balance if the membership ID exists for the Pioneer', async () => {
    const existingMembership = await Membership.create({
      user: new mongoose.Types.ObjectId(),
      membership_id: '0a0a0a-0a0a-0a0a',
      membership_class: MembershipClassType.TRIPLE_GOLD,
      membership_expiry_date: new Date('2026-01-26T00:00:00.000Z'),
      mappi_balance: 1000
    });

    const membershipData = await updateMappiBalance(
      '0a0a0a-0a0a-0a0a',
      TransactionType.MAPPI_DEPOSIT,
      5
    ) as IMembership;

    expect(membershipData.toObject()).toMatchObject({
      membership_id: '0a0a0a-0a0a-0a0a',
      mappi_balance: 1005
    });
  });

  it('should deduct from membership balance if the membership ID exists for the Pioneer', async () => {
    const existingMembership = await Membership.create({
      user: new mongoose.Types.ObjectId(),
      membership_id: '0b0b0b-0b0b-0b0b',
      membership_class: MembershipClassType.DOUBLE_GOLD,
      membership_expiry_date: new Date('2025-06-30T00:00:00.000Z'),
      mappi_balance: 400
    });

    const membershipData = await updateMappiBalance(
      '0b0b0b-0b0b-0b0b',
      TransactionType.MAPPI_WITHDRAWAL,
      5
    ) as IMembership;

    expect(membershipData.toObject()).toMatchObject({
      membership_id: '0b0b0b-0b0b-0b0b',
      mappi_balance: 395
    });
  });

  it('should throw an error when an exception occurs', async () => {  
    // Mock the Membership model to throw an error
    jest.spyOn(Membership, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });
    
    await expect(
      updateMappiBalance(
        '0e0e0e-0e0e-0e0e', 
        TransactionType.MAPPI_DEPOSIT, 
        100
      )
    ).rejects.toThrow('Failed to update Mappi balance; please try again later');
  });
});