import { deleteUser } from '../../src/controllers/userController';
import * as userService from '../../src/services/user.service';

jest.mock('../../src/services/user.service', () => ({
  deleteUser: jest.fn(),
}));

describe('UserController', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      currentUser: {
        pi_uid: '0a0a0a-0a0a-0a0a',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('deleteUser function', () => {
    it('should delete user and return successful message', async () => {
      const expectedDeletedData = { 
        user: { pi_uid: '0a0a0a-0a0a-0a0a' },
        sellers: [{ seller_id: '0a0a0a-0a0a-0a0a' }],
        userSetting: { user_settings_id: '0a0a0a-0a0a-0a0a' }, 
      };

      (userService.deleteUser as jest.Mock).mockResolvedValue(expectedDeletedData);

      await deleteUser(req, res);

      expect(userService.deleteUser).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
        deletedData: expectedDeletedData,
      });
    });

    it('should return appropriate [500] if delete user fails', async () => {
      const mockError = new Error('An error occurred while deleting user; please try again later');

      (userService.deleteUser as jest.Mock).mockRejectedValue(mockError);

      await deleteUser(req, res);

      expect(userService.deleteUser).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
