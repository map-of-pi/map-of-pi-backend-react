import { 
  createNotification,
  getNotifications,
  clearNotification 
} from '../../src/controllers/notificationController';
import * as notificationService from '../../src/services/notification.service';

jest.mock('../../src/services/notification.service', () => ({
  addNotification: jest.fn(),
  getNotifications: jest.fn(),
  clearNotification: jest.fn()
}));

describe('notificationController', () => {
  let req: any;
  let res: any;

  describe('createNotification function', () => {
    beforeEach(() => {
      req = {
        currentUser: {
          pi_uid: '0a0a0a-0a0a-0a0a',
        },
        body : {
          reason: 'TEST_REASON'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should create a notification and return [200] on success', async () => {
      const mockNotification = { id: 'notification_1', reason: 'TEST_REASON' };
      
      (notificationService.addNotification as jest.Mock).mockResolvedValue(mockNotification);

      await createNotification(req, res);

      expect(notificationService.addNotification).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 'TEST_REASON');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification created successfully',
        notification: mockNotification,
      });
    });

    it('should return [401] if no authenticated user', async () => {
      req.currentUser = undefined;

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return [500] if creating notification fails', async () => {
      const error = new Error('Service layer error');
      (notificationService.addNotification as jest.Mock).mockRejectedValue(error);
  
      await createNotification(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An error occurred while creating notification; please try again later',
      });
    });
  });

  describe('getNotifications function', () => {
    beforeEach(() => {
      req = {
        params: { 
          pi_uid: '0a0a0a-0a0a-0a0a',
        },
        query : {
          skip: '5',
          limit: '10'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should get notifications (pagination provided) and return [200] on success', async () => {
      const mockNotifications = [
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: false, reason: 'TEST_REASON_A' },
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: true, reason: 'TEST_REASON_B' }
      ];
      
      (notificationService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await getNotifications(req, res);

      expect(notificationService.getNotifications).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 5, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });

    it('should get notifications (pagination not provided) and return [200] on success', async () => {
      req.query = { }; // no skip + limit params
      const mockNotifications = [
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: false, reason: 'TEST_REASON_A' },
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: true, reason: 'TEST_REASON_B' },
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: true, reason: 'TEST_REASON_C' },
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: true, reason: 'TEST_REASON_D' },
      ];
      
      (notificationService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      await getNotifications(req, res);

      expect(notificationService.getNotifications).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a', 0, 20);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });

    it('should return [500] if getting notifications fails', async () => {
      const error = new Error('Service layer error');
      (notificationService.getNotifications as jest.Mock).mockRejectedValue(error);
  
      await getNotifications(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An error occurred while getting notifications; please try again later',
      });
    });
  });

  describe('clearNotification function', () => {
    beforeEach(() => {
      req = {
        params: { 
          id: '64f5a0f2a86d1f9f3b7e4e87',
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should clear notification and return [200] on success', async () => {
      const mockUpdatedNotification = [
        { pi_uid: '0a0a0a-0a0a-0a0a', is_cleared: true, reason: 'TEST_REASON_A' }
      ];
      
      (notificationService.clearNotification as jest.Mock).mockResolvedValue(mockUpdatedNotification);

      await clearNotification(req, res);

      expect(notificationService.clearNotification).toHaveBeenCalledWith('64f5a0f2a86d1f9f3b7e4e87');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification cleared successfully',
        updatedNotification: mockUpdatedNotification
      });
    });

    it('should return [500] if clearing notification fails', async () => {
      const error = new Error('Service layer error');
      (notificationService.clearNotification as jest.Mock).mockRejectedValue(error);
  
      await clearNotification(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An error occurred while clearing notification; please try again later',
      });
    });
  });
});