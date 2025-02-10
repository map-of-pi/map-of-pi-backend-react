import { getTransactionRecords, submitTransaction } from '../../src/controllers/transactionController';
import * as transactionService from '../../src/services/transaction.service';

jest.mock('../../src/services/transaction.service', () => ({
  getAllTransactionRecords: jest.fn(),
  processTransaction: jest.fn()
}));

describe('transactionController', () => {
  let req: any;
  let res: any;

  describe('getTransactionRecords function', () => {
    beforeEach(() => {
      req = { 
        params: {} 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when transaction records exist for associated ID', async () => {
      req.params.transaction_id = '0a0a0a-0a0a-0a0a';

      const expectedTransactionRecords = [
        {
          transaction_id: "0a0a0a-0a0a-0a0a",
          transaction_type: "Mappi Withdrawal",
          amount: 1,
          reason: "Sell item 1 week"
        },
        {
          transaction_id: "0a0a0a-0a0a-0a0a",
          transaction_type: "Mappi Deposit",
          amount: 100,
          reason: "`Mappi credited for updated Membership to Gold"
        }
      ];
      
      (transactionService.getAllTransactionRecords as jest.Mock).mockResolvedValue(expectedTransactionRecords);
      
      await getTransactionRecords(req, res);

      expect(transactionService.getAllTransactionRecords).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedTransactionRecords);
    });

    it('should return appropriate [204] when transaction records do not exist for associated ID', async () => {
      req.params.transaction_id = '0b0b0b-0b0b-0b0b';
      
      (transactionService.getAllTransactionRecords as jest.Mock).mockResolvedValue([]);
      
      await getTransactionRecords(req, res);

      expect(transactionService.getAllTransactionRecords).toHaveBeenCalledWith('0b0b0b-0b0b-0b0b');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: "Transaction records not found" });
    });

    it('should return appropriate [500] when getting transaction records fails', async () => {
      req.params.transaction_id = '0a0a0a-0a0a-0a0a';

      const mockError = new Error('An error occurred while fetching transaction records; please try again later');

      (transactionService.getAllTransactionRecords as jest.Mock).mockRejectedValue(mockError);

      await getTransactionRecords(req, res);

      expect(transactionService.getAllTransactionRecords).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('submitTransaction function', () => {
    beforeEach(() => {
      req = { 
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when the transaction is submitted successfully', async () => {
      req.currentUser = {
        pi_uid: "'0c0c0c-0c0c-0c0c"
      }
      req.body = {
        transaction_type: "Mappi Withdrawal",
        amount: 1,
        reason: "Sell item 1 week"
      };
      const expectedTransactionRecordData = {
        currentUser: { pi_uid: "0c0c0c-0c0c-0c0c" },
        transaction_type: "Mappi Withdrawal",
        amount: 1,
        reason: "Sell item 1 week"
      };
      
      (transactionService.processTransaction as jest.Mock).mockResolvedValue(expectedTransactionRecordData);
      
      await submitTransaction(req, res);

      expect(transactionService.processTransaction).toHaveBeenCalledWith(
        req.currentUser.pi_uid, 
        req.body.transaction_type,
        req.body.amount,
        req.body.reason
        );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedTransactionRecordData);
    });

    it('should return appropriate [500] when submitting transaction fails', async () => {
      req.currentUser = {
        pi_uid: "0d0d0d-0d0d-0d0d"
      }
      req.body = {
        transaction_type: "Mappi Deposit",
        amount: 100,
        reason: "`Mappi credited for updated Membership to Gold"
      };
      
      const mockError = new Error('An error occurred while submitting transaction; please try again later');
      
      (transactionService.processTransaction as jest.Mock).mockRejectedValue(mockError);
      
      await submitTransaction(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});