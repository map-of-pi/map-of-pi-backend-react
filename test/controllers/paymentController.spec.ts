import { onIncompletePaymentFound, onPaymentApproval, onPaymentCancellation, onPaymentCompletion } from '../../src/controllers/paymentController';
import { 
  processIncompletePayment, 
  processPaymentApproval, 
  processPaymentCancellation, 
  processPaymentCompletion
} from '../../src/helpers/payment';

jest.mock('../../src/helpers/payment');

describe('paymentController', () => {
  let req: any;
  let res: any;

  describe('onIncompletePaymentFound function', () => {
    const mockPaymentInfo = {
      identifier: 'paymentInfo1_TEST',
      transaction: {
        txid: 'txid1_TEST',
        _link: 'https://link.url'
      }
    };
    const mockProcessedResult = {
      success: true,
      message: `Payment completed from incomplete payment with id ${ mockPaymentInfo.identifier }`
    };

    beforeEach(() => {
      req = {
        body: {
          payment: mockPaymentInfo
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return [200] and processed payment on success', async () => {
      (processIncompletePayment as jest.Mock).mockResolvedValue(mockProcessedResult);

      await onIncompletePaymentFound(req, res);

      expect(processIncompletePayment).toHaveBeenCalledWith(mockPaymentInfo);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProcessedResult);
    });

    it('should return [500] if payment processor throws error', async () => {
      const mockError = new Error('An error occurred while processing incomplete payment; please try again later');
      (processIncompletePayment as jest.Mock).mockRejectedValue(mockError);
  
      await onIncompletePaymentFound(req, res);
  
      expect(processIncompletePayment).toHaveBeenCalledWith(mockPaymentInfo);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message 
      });
    });
  });

  describe('onPaymentApproval function', () => {
    const mockUser = { pi_username: 'piUID1_TEST' };
    const mockPaymentId = 'paymentId1_TEST';

    beforeEach(() => {
      req = {
        currentUser: mockUser,
        body: { paymentId: mockPaymentId }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return [200] and approval response on success', async () => {
      const mockProcessedResult = {
        success: true,
        message: `Payment approved with id ${ mockPaymentId }`
      };
      
      (processPaymentApproval as jest.Mock).mockResolvedValue(mockProcessedResult);

      await onPaymentApproval(req, res);

      expect(processPaymentApproval).toHaveBeenCalledWith(mockPaymentId, mockUser);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProcessedResult);
    });

    it('should return [500] if payment approval processor throws error', async () => {
      const mockError = new Error('An error occurred while approving Pi payment; please try again later');
      (processPaymentApproval as jest.Mock).mockRejectedValue(mockError);
  
      await onPaymentApproval(req, res);
  
      expect(processPaymentApproval).toHaveBeenCalledWith(mockPaymentId, mockUser);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message 
      });
    });
  });

  describe('onPaymentCompletion function', () => {
    const mockPaymentId = 'paymentId1_TEST';
    const mockTxId = 'txId1_TEST';

    beforeEach(() => {
      req = {
        body: { paymentId: mockPaymentId, txid: mockTxId }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return [200] and completed payment response on success', async () => {
      const mockProcessedResult = {
        success: true,
        message: `Payment completed with id ${ mockPaymentId }`
      };

      (processPaymentCompletion as jest.Mock).mockResolvedValue(mockProcessedResult);

      await onPaymentCompletion(req, res);

      expect(processPaymentCompletion).toHaveBeenCalledWith(mockPaymentId, mockTxId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProcessedResult);
    });

    it('should return [500] if payment completion processor throws error', async () => {
      const mockError = new Error('An error occurred while completing Pi payment; please try again later');
      (processPaymentCompletion as jest.Mock).mockRejectedValue(mockError);
  
      await onPaymentCompletion(req, res);
  
      expect(processPaymentCompletion).toHaveBeenCalledWith(mockPaymentId, mockTxId);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message 
      });
    });
  });

  describe('onPaymentCancellation function', () => {
    const mockPaymentId = 'paymentId1_TEST';

    beforeEach(() => {
      req = {
        body: { paymentId: mockPaymentId }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return [200] and cancelled payment result on success', async () => {
      const mockProcessedResult = {
        success: true,
        message: `Payment cancelled with id ${ mockPaymentId }`
      };

      (processPaymentCancellation as jest.Mock).mockResolvedValue(mockProcessedResult);

      await onPaymentCancellation(req, res);

      expect(processPaymentCancellation).toHaveBeenCalledWith(mockPaymentId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProcessedResult);
    });

    it('should return [500] if payment cancellation processor throws error', async () => {
      const mockError = new Error('An error occurred while cancelling Pi payment; please try again later');
      (processPaymentCancellation as jest.Mock).mockRejectedValue(mockError);
  
      await onPaymentCancellation(req, res);
  
      expect(processPaymentCancellation).toHaveBeenCalledWith(mockPaymentId);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message 
      });
    });
  });
});