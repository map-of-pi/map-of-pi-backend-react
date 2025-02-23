import { loginAdmin, registerAdmin, getAdminInfo, activateAdmin } from '../../../src/controllers/admin/adminController';
import * as adminService from '../../../src/services/admin.service';

jest.mock('../../../src/services/admin.service', () => ({
  loginAdmin: jest.fn(),
  registerAdmin: jest.fn(),
  getAdminInfoByToken: jest.fn(),
  activateAdminById: jest.fn()
}));

describe('AdminController', () => {
  let req: any;
  let res: any;

  describe('loginAdmin function', () => {
    beforeEach(() => {
      req = { 
        body: {
          email: 'testAdmin@email.com',
          password: 'test1@2#3' 
        } 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when the admin is successfully logged in', async () => {
      const expectedAdminData = { 
        admin: { 
          email: req.body.email,
          username: 'testAdmin',
          role: 'superadmin'
        },
        token: 'testAdminToken'
      };

      (adminService.loginAdmin as jest.Mock).mockResolvedValue(expectedAdminData);

      await loginAdmin(req, res);

      expect(adminService.loginAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin logged in successfully',
        admin: expectedAdminData.admin,
        token: expectedAdminData.token
      });
    });

    it('should return appropriate [404] if admin is not found', async () => {
      const mockError = new Error('Admin not found');

      (adminService.loginAdmin as jest.Mock).mockRejectedValue(mockError);

      await loginAdmin(req, res);

      expect(adminService.loginAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });

    it('should return appropriate [401] if admin credentials are invalid', async () => {
      const mockError = new Error('Invalid credentials');

      (adminService.loginAdmin as jest.Mock).mockRejectedValue(mockError);

      await loginAdmin(req, res);

      expect(adminService.loginAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while logging in admin; please try again later');

      (adminService.loginAdmin as jest.Mock).mockRejectedValue(mockError);

      await loginAdmin(req, res);

      expect(adminService.loginAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('registerAdmin function', () => {
    beforeEach(() => {
      req = { 
        body: {
          email: 'testAdmin@email.com',
          password: 'test1@2#3' 
        } 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when admin registration is successful', async () => {
      const expectedAdminData = { 
        admin: { 
          email: req.body.email,
          username: 'testAdmin',
          role: 'superadmin'
        }
      };

      (adminService.registerAdmin as jest.Mock).mockResolvedValue(expectedAdminData);

      await registerAdmin(req, res);

      expect(adminService.registerAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin registered successfully',
        admin: expectedAdminData
      });
    });

    it('should return appropriate [400] if registered admin already exists', async () => {
      const mockError = new Error('Admin already exists');

      (adminService.registerAdmin as jest.Mock).mockRejectedValue(mockError);

      await registerAdmin(req, res);

      expect(adminService.registerAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while registering admin; please try again later');

      (adminService.registerAdmin as jest.Mock).mockRejectedValue(mockError);

      await registerAdmin(req, res);

      expect(adminService.registerAdmin).toHaveBeenCalledWith(
        req.body.email,
        req.body.password
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('getAdminInfo function', () => {
    beforeEach(() => {
      req = { 
        headers: {
          authorization: 'Bearer t0K3n12345' 
        } 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when admin info is successfully retrieved', async () => {
      const expectedAdminData = { 
        admin: { 
          email: 'testAdmin@email.com',
          username: 'testAdmin',
          role: 'superadmin'
        }
      };

      (adminService.getAdminInfoByToken as jest.Mock).mockResolvedValue(expectedAdminData);

      await getAdminInfo(req, res);

      expect(adminService.getAdminInfoByToken).toHaveBeenCalledWith(
        req.headers.authorization.split(" ")[1]
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedAdminData);
    });

    it('should return appropriate [404] if admin is not found', async () => {
      const mockError = new Error('Admin not found');

      (adminService.getAdminInfoByToken as jest.Mock).mockRejectedValue(mockError);

      await getAdminInfo(req, res);

      expect(adminService.getAdminInfoByToken).toHaveBeenCalledWith(
        req.headers.authorization.split(" ")[1]
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while fetching admin info; please try again later');

      (adminService.getAdminInfoByToken as jest.Mock).mockRejectedValue(mockError);

      await getAdminInfo(req, res);

      expect(adminService.getAdminInfoByToken).toHaveBeenCalledWith(
        req.headers.authorization.split(" ")[1]
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('activateAdmin function', () => {
    beforeEach(() => {
      req = { 
        params: {
          id: 'testAdminId' 
        } 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when admin activation is successful', async () => {
      const expectedAdminData = { 
        admin: { 
          email: 'testAdmin@email.com',
          username: 'testAdmin',
          role: 'superadmin'
        }
      };

      (adminService.activateAdminById as jest.Mock).mockResolvedValue(expectedAdminData);

      await activateAdmin(req, res);

      expect(adminService.activateAdminById).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin activated successfully',
        admin: expectedAdminData
      });
    });

    it('should return appropriate [404] if admin is not found', async () => {
      const mockError = new Error('Admin not found');

      (adminService.activateAdminById as jest.Mock).mockRejectedValue(mockError);

      await activateAdmin(req, res);

      expect(adminService.activateAdminById).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while activating admin; please try again later');

      (adminService.activateAdminById as jest.Mock).mockRejectedValue(mockError);

      await activateAdmin(req, res);

      expect(adminService.activateAdminById).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
