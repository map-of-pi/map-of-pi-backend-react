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
    const membershipData = await getSingleMembershipById('0a0a0a-0a0a-0a0a') as IMembership;

    const plainObject = await convertToPlainObject(membershipData);

    expect(plainObject).toMatchObject({
      membership_id: '0a0a0a-0a0a-0a0a',
      membership_class_type: "Triple Gold",
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
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToPlainObject = (membership: IMembership): any => {
    const plainObject = membership.toObject();

    if (plainObject.membership_expiry_date instanceof Date) {
      plainObject.membership_expiry_date = new Date(plainObject.membership_expiry_date);
      plainObject.membership_expiry_date.setHours(0, 0, 0, 0);
    }
    
    return plainObject;
  };

  const assertMembership = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual; // ignore DB values.
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should build new membership if it does not exist for the Pioneer', async () => {
    const userData = await User.findOne({ pi_uid: '0e0e0e-0e0e-0e0e' }) as IUser;

    const membership = {
      membership_class: MembershipClassType.MEMBER,
      membership_duration: 2,
      mappi_allowance: 5
    }

    const membershipData = (await addOrUpdateMembership(
      userData as IUser, 
      membership.membership_class, 
      membership.membership_duration, 
      membership.mappi_allowance 
    )) as IMembership;

    // Convert `membershipData` to a plain object if it's a Mongoose document
    const plainObject = await convertToPlainObject(membershipData);

    const current_date = new Date();

    // Calculate the membership_expiry_date (current_date + duration in weeks)
    const durationInMs = (membership.membership_duration || 1) * 7 * 24 * 60 * 60 * 1000;
    const expiry_date = new Date(current_date.getTime() + durationInMs);
    expiry_date.setHours(0, 0, 0, 0);

    // filter and assert membership record associated with the Pioneer
    assertMembership(plainObject, {
      membership_id: userData.pi_uid,
      membership_class_type: membership.membership_class,
      membership_expiry_date: expiry_date,
      mappi_balance: membership.mappi_allowance
    });
  });

  it('should update existing membership if it does exist for the Pioneer', async () => {  
    const userData = await User.findOne({ pi_uid: '0b0b0b-0b0b-0b0b' }) as IUser;
    const existingMembershipData = await Membership.findOne({ membership_id: userData.pi_uid });

    const membership = {
      membership_class: MembershipClassType.TRIPLE_GOLD,
      membership_duration: 50,
      mappi_allowance: 2000
    }

    const membershipData = (await addOrUpdateMembership(
      userData as IUser, 
      membership.membership_class, 
      membership.membership_duration, 
      membership.mappi_allowance 
    )) as IMembership;

    // Convert `membershipData` to a plain object if it's a Mongoose document
    const plainObject = await convertToPlainObject(membershipData);
    const current_date = existingMembershipData?.membership_expiry_date
      ? new Date(existingMembershipData.membership_expiry_date)
      : new Date(); // Fallback to today if `membership_expiry_date` is undefined.
    current_date.setHours(0, 0, 0, 0);

    // Calculate the membership_expiry_date (current_date + duration in weeks)
    const durationInMs = (membership.membership_duration || 1) * 7 * 24 * 60 * 60 * 1000;
    const expiry_date = new Date(current_date.getTime() + durationInMs)
    expiry_date.setHours(0, 0, 0, 0);

    // filter and assert membership record associated with the Pioneer
    assertMembership(plainObject, {
      membership_id: userData.pi_uid,
      membership_class_type: membership.membership_class,
      membership_expiry_date: expiry_date,
      mappi_balance: (existingMembershipData?.mappi_balance || 0) + membership.mappi_allowance
    });
  });

  it('should throw an error when an exception occurs', async () => {  
    const userData = await User.findOne({ pi_uid: '0e0e0e-0e0e-0e0e' }) as IUser;
    
    const membership = {
      membership_class: MembershipClassType.MEMBER,
      membership_duration: 2,
      mappi_allowance: 5
    }

    // Mock the Membership model to throw an error
    jest.spyOn(Membership, 'findOne').mockImplementationOnce(() => {
      throw new Error('Mock database error');
    });

    await expect(
      addOrUpdateMembership(
        userData as IUser,
        membership.membership_class,
        membership.membership_duration,
        membership.mappi_allowance
      )
    ).rejects.toThrow('Failed to add or update membership; please try again later');
  });
});

describe('updateMembershipBalance function', () => {
  it('should add to membership balance if the membership ID exists for the Pioneer', async () => {      
    const existingMembership = await Membership.findOne({ membership_id: '0a0a0a-0a0a-0a0a' }) as IMembership;   
    
    const membershipData = await updateMappiBalance(
      existingMembership.membership_id, TransactionType.MAPPI_DEPOSIT, 5) as IMembership;

    expect(membershipData.toObject()).toMatchObject({
      membership_id: existingMembership.membership_id,
      membership_class_type: existingMembership.membership_class_type,
      membership_expiry_date: existingMembership.membership_expiry_date,
      mappi_balance: existingMembership.mappi_balance + 5 // 1005
    });
  });

  it('should deduct from membership balance if the membership ID exists for the Pioneer', async () => {      
    const existingMembership = await Membership.findOne({ membership_id: '0b0b0b-0b0b-0b0b' }) as IMembership;   
    
    const membershipData = await updateMappiBalance(
      existingMembership.membership_id, TransactionType.MAPPI_WITHDRAWAL, 5) as IMembership;

    expect(membershipData.toObject()).toMatchObject({
      membership_id: existingMembership.membership_id,
      membership_class_type: existingMembership.membership_class_type,
      membership_expiry_date: existingMembership.membership_expiry_date,
      mappi_balance: existingMembership.mappi_balance - 5 // 395
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