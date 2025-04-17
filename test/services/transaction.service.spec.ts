import Membership from '../../src/models/Membership';
import TransactionRecord from '../../src/models/TransactionRecord';
import { MembershipClassType } from '../../src/models/enums/membershipClassType';
import { TransactionType } from '../../src/models/enums/transactionType';
import { 
  getAllTransactionRecords,
  processTransaction,
  createTransactionRecord 
} from '../../src/services/transaction.service';
import * as membershipService from '../../src/services/membership.service';
import { IMembership, ITransactionRecord } from '../../src/types';
import * as transactionService from '../../src/services/transaction.service';

describe('getAllTransactionRecords function', () => {
  // Helper function to convert Mongoose documents to plain objects
  const convertToPlainObjects = async (transactionRecords: ITransactionRecord[]): Promise<any[]> => {
    return await Promise.all(
      transactionRecords.map(async (transactionRecord) => {
        const plainObject = transactionRecord.toObject();

        // Normalize the 'date' field within 'transaction_record' object
        if (Array.isArray(plainObject.transaction_records)) {
          plainObject.transaction_records = plainObject.transaction_records.map((record: { date: Date | string }) => {
            if (record.date instanceof Date) {
              record.date = record.date.toISOString();
            }
            return record;
          });
        }
        return plainObject;
      })
    );
  };

  jest.spyOn(transactionService, 'createTransactionRecord').mockResolvedValue({
    transaction_id: 'mock-id',
    transaction_records: [
      {
        transaction_type: TransactionType.MAPPI_DEPOSIT,
        amount: 10,
        reason: 'Mocked transaction',
        date: new Date(),
      }
    ]
  } as unknown as ITransactionRecord);
  
  const assertTransactionRecords = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual; // ignore DB values.
    
    // Normalize transaction_record by removing _id from nested objects
    if (Array.isArray(filteredActual.transaction_records)) {
      filteredActual.transaction_records = filteredActual.transaction_records.map(
        ({ _id, ...rest }: { _id: string; [key: string]: any }) => rest
      );
    }

    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should return existing transaction records associated with the Pioneer', async () => {  
    const transactionRecordsData = await getAllTransactionRecords('0a0a0a-0a0a-0a0a') as ITransactionRecord[];

    const plainObjects = await convertToPlainObjects(transactionRecordsData);

    const expectedRecords = [
      {
        transaction_id: '0a0a0a-0a0a-0a0a',
        transaction_records: [
          {
            transaction_type: TransactionType.MAPPI_DEPOSIT,
            amount: 100,
            reason: 'Mappi credited for updated Membership to Gold',
            date: '2025-02-10T00:00:00.000Z',
          },
          {
            transaction_type: TransactionType.MAPPI_WITHDRAWAL,
            amount: -1,
            reason: 'Sell item 1 week',
            date: '2025-02-10T00:00:00.000Z',
          },
        ],
      },
    ];

    // Use the assert function to validate each record
    plainObjects.forEach((record, index) => {
      assertTransactionRecords(record, expectedRecords[index]);
    });
  });

  it('should return null if there are no existing transaction records associated with the Pioneer', async () => {  
    const transactionRecordsData = await getAllTransactionRecords('0d0d0d-0d0d-0d0d') as ITransactionRecord[];

    // Expect no transaction records
    expect(transactionRecordsData).toEqual([]);
  });

  it('should throw an error when an exception occurs', async () => {  
    // Mock the TransactionRecord model to throw an error
    jest.spyOn(TransactionRecord, 'find').mockImplementationOnce(() => {
      throw new Error('Unexpected exception occurred');
    });

    await expect(getAllTransactionRecords('0d0d0d-0d0d-0d0d')).rejects.toThrow(
      'Failed to get transaction records; please try again later'
    );
  });
});

describe('processTransaction function', () => {
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToMembershipPlainObject = (membership: IMembership): any => {
    const plainObject = membership.toObject();

    if (plainObject.membership_expiry_date instanceof Date) {
      plainObject.membership_expiry_date = plainObject.membership_expiry_date.toISOString();
    }
    
    return plainObject;
  };

  const convertToTransactionRecordPlainObject = (record: ITransactionRecord): any => {
    const plainObject = record.toObject();
  
    if (Array.isArray(plainObject.transaction_records)) {
      plainObject.transaction_records = plainObject.transaction_records.map((record: { date: string | number | Date; }) => {
        if (record.date instanceof Date) {
          record.date.setHours(0, 0, 0, 0);
          record.date = record.date.toISOString();
        }
  
        return {
          ...record
        };
      });
    }
  
    return plainObject;
  };

  const assertObjects = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual;
  
    if (Array.isArray(filteredActual.transaction_records)) {
      filteredActual.transaction_records = filteredActual.transaction_records.map(
        ({ _id, ...rest }: { _id: string; date?: string; [key: string]: any }) => {
          return {
            ...rest,
          };
        }
      );
    }
  
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should create the transaction record and update the Mappi balance successfully', async () => {    
    try {
      const transactionRecord = await processTransaction(
        '0b0b0b-0b0b-0b0b', TransactionType.MAPPI_DEPOSIT, 100, "Mappi credited for updated Membership to Gold"
      ) as ITransactionRecord;

      const existingMembershipData = await Membership.findOne({ membership_id: '0b0b0b-0b0b-0b0b' }) as IMembership; 
      
      const expectedMembership = {
        membership_id: '0b0b0b-0b0b-0b0b',
        membership_class: MembershipClassType.DOUBLE_GOLD,
        membership_expiry_date: '2025-06-30T00:00:00.000Z',
        mappi_balance: 500
      }

      const expectedTransactionRecord = {
        transaction_id: '0b0b0b-0b0b-0b0b',
        transaction_records: [
          {
            transaction_type: TransactionType.MAPPI_DEPOSIT,
            amount: 100,
            reason: 'Mappi credited for updated Membership to Gold',
            date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          }
        ]
      };

      // Convert Mongoose document to plain object
      const plainObjectMembership = convertToMembershipPlainObject(existingMembershipData);
      const plainObjectTransactionRecord = convertToTransactionRecordPlainObject(transactionRecord);

      // Assert that the both transaction record and membership was updated correctly
      assertObjects(plainObjectMembership, expectedMembership);
      assertObjects(plainObjectTransactionRecord, expectedTransactionRecord);

    } catch (error: any) {
      throw new Error(`Process transaction test failed with error: ${error.message}`);
    }
  });

  it('should create the transaction record but not update the Mappi balance because the Transaction Type is not applicable', async () => {    
    // Use jest.spyOn to mock the updateMappiBalance function within this test only
    const updateMappiBalanceMock = jest.spyOn(membershipService, 'updateMappiBalance').mockResolvedValue({} as IMembership);
    
    try {
      const transactionRecord = await processTransaction(
        '0c0c0c-0c0c-0c0c', TransactionType.PI_WITHDRAWAL, 10, "Purchased seller item"
      ) as ITransactionRecord;

      const existingMembershipData = await Membership.findOne({ membership_id: '0c0c0c-0c0c-0c0c' }) as IMembership; 
      
      const expectedMembership = {
        membership_id: '0c0c0c-0c0c-0c0c',
        membership_class: MembershipClassType.GOLD,
        membership_expiry_date: '2025-04-23T00:00:00.000Z',
        mappi_balance: 200 // Unchanged Mappi balance
      }

      const expectedTransactionRecord = {
        transaction_id: '0c0c0c-0c0c-0c0c',
        transaction_records: [
          {
            transaction_type: TransactionType.PI_WITHDRAWAL,
            amount: -10,
            reason: 'Purchased seller item',
            date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          }
        ]
      };

      // Convert Mongoose document to plain object
      const plainObjectMembership = convertToMembershipPlainObject(existingMembershipData);
      const plainObjectTransactionRecord = convertToTransactionRecordPlainObject(transactionRecord);

      // Assert that the both transaction record and membership was updated correctly
      assertObjects(plainObjectMembership, expectedMembership);
      assertObjects(plainObjectTransactionRecord, expectedTransactionRecord);

      // Verify that the updateMappiBalance function was not called
      expect(updateMappiBalanceMock).not.toHaveBeenCalled();

    } catch (error: any) {
      throw new Error(`Process transaction test failed with error: ${error.message}`);
    } finally {
      // Restore the original implementation of the updateMappiBalance function
      updateMappiBalanceMock.mockRestore();
    }
  });

  it('should throw an error when an exception occurs', async () => {  
    // Mock the TransactionRecord model to throw an error
    jest.spyOn(TransactionRecord.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Unexpected exception occurred');
    });

    // Call the processTransaction function and assert it throws the expected error
    await expect(processTransaction(
      '0b0b0b-0b0b-0b0b', TransactionType.MAPPI_DEPOSIT, 100, "Mappi credited for updated Membership to Gold"
    )).rejects.toThrow('Failed to submit transaction; please try again later');
  });
});

describe('createTransactionRecord function', () => {
  // Helper function to convert Mongoose document to a plain object and normalize values accordingly
  const convertToTransactionRecordPlainObject = (record: ITransactionRecord): any => {
    const plainObject = record.toObject();
  
    if (Array.isArray(plainObject.transaction_records)) {
      plainObject.transaction_records = plainObject.transaction_records.map((
        record: { date: string | number | Date; }, index: number, array: any[]) => {
        if (record.date instanceof Date) {
           // Set time to 00:00:00.000 only for the last (newest) transaction record
           record.date = index === array.length - 1 
           ? new Date(record.date.setHours(0, 0, 0, 0)).toISOString()
           : record.date.toISOString();
        }
  
        return {
          ...record
        };
      });
    }
  
    return plainObject;
  };

  const assertObjects = (actual: any, expected: any) => {
    const { _id, __v, createdAt, updatedAt, ...filteredActual } = actual;
  
    if (Array.isArray(filteredActual.transaction_records)) {
      filteredActual.transaction_records = filteredActual.transaction_records.map(
        ({ _id, ...rest }: { _id: string; date?: string; [key: string]: any }) => {
          return {
            ...rest,
          };
        }
      );
    }
  
    expect(filteredActual).toEqual(expect.objectContaining(expected));
  };

  it('should add a new transaction record to existing transaction records for the Pioneer', async () => {    
    const existingTransactionRecords = await TransactionRecord.findOne({ transaction_id: '0a0a0a-0a0a-0a0a' });
    // Count the number of previous transaction entries (if any)
    const existingTransactionRecordsCount = existingTransactionRecords ? existingTransactionRecords.transaction_records.length : 0;

    const transactionRecords = await createTransactionRecord(
      '0a0a0a-0a0a-0a0a', TransactionType.MAPPI_DEPOSIT, 20, "Mappi credited for updated Membership to Green"
    ) as ITransactionRecord;

    // Convert Mongoose document to plain object
    const plainObjectTransactionRecords = convertToTransactionRecordPlainObject(transactionRecords);

    // The new transaction should be appended to the existing array
    expect(plainObjectTransactionRecords.transaction_records.length).toBe(existingTransactionRecordsCount + 1);

    const expectedTransactionRecords = {
      transaction_id: '0a0a0a-0a0a-0a0a',
      transaction_records: [
        {
          transaction_type: TransactionType.MAPPI_DEPOSIT,
          amount: 100,
          reason: 'Mappi credited for updated Membership to Gold',
          date: "2025-02-10T00:00:00.000Z"
        },
        {
          transaction_type: TransactionType.MAPPI_WITHDRAWAL,
          amount: -1,
          reason: 'Sell item 1 week',
          date: "2025-02-10T00:00:00.000Z"
        },
        {
          transaction_type: TransactionType.MAPPI_DEPOSIT,
          amount: 20,
          reason: 'Mappi credited for updated Membership to Green',
          date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        }
      ]
    };

    // Assert that the transaction record was appended correctly
    expect(plainObjectTransactionRecords.transaction_records.length).toBe(3);
    assertObjects(plainObjectTransactionRecords, expectedTransactionRecords);
  });

  it('should create a new transaction record for the Pioneer', async () => {    
    const transactionRecords = await createTransactionRecord(
      '0d0d0d-0d0d-0d0d', TransactionType.MAPPI_DEPOSIT, 1, "Membership initiated to Casual"
    ) as ITransactionRecord;

    // Convert Mongoose document to plain object
    const plainObjectTransactionRecords = convertToTransactionRecordPlainObject(transactionRecords);

    const expectedTransactionRecords = {
      transaction_id: '0d0d0d-0d0d-0d0d',
      transaction_records: [
        {
          transaction_type: TransactionType.MAPPI_DEPOSIT,
          amount: 1,
          reason: 'Membership initiated to Casual',
          date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        }
      ]
    };
    assertObjects(plainObjectTransactionRecords, expectedTransactionRecords);
  });

  it('should throw an error when an exception occurs', async () => {  
    // Mock the TransactionRecord model to throw an error
    jest.spyOn(TransactionRecord.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Unexpected exception occurred');
    });

    // Call the createTransactionRecord function and assert it throws the expected error
    await expect(createTransactionRecord(
      '0d0d0d-0d0d-0d0d', TransactionType.MAPPI_DEPOSIT, 100, "Mappi credited for updated Membership to Gold"
    )).rejects.toThrow('Failed to create transaction record; please try again later');
  });
});