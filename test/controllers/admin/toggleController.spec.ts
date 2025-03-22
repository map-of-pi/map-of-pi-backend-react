import { 
  getToggles, 
  getToggle, 
  addToggle, 
  updateToggle, 
  deleteToggle 
} from '../../../src/controllers/admin/toggleController';
import * as toggleService from '../../../src/services/admin/toggle.service';

jest.mock('../../../src/services/admin/toggle.service', () => ({
  getToggles: jest.fn(),
  getToggleByName: jest.fn(),
  addToggle: jest.fn(),
  updateToggle: jest.fn(),
  deleteToggleByName: jest.fn()
}));

describe('toggleController', () => {
  let req: any;
  let res: any;

  describe('getToggles function', () => {
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return appropriate [200] when toggles are successfully fetched', async () => {
      const expectedToggles = [
      { name: 'testToggle', enabled: false, description: 'Toggle for testing' },
      { name: 'testToggle_1', enabled: true, description: 'Toggle for testing_1' },
    ];
      
      (toggleService.getToggles as jest.Mock).mockResolvedValue(expectedToggles);

      await getToggles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedToggles);
    });

    it('should return appropriate [500] when getting toggles fail', async () => {
      const mockError = new Error('An error occurred while fetching toggles; please try again later');

      (toggleService.getToggles as jest.Mock).mockRejectedValue(mockError);

      await getToggles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('getToggle function', () => {
    beforeEach(() => {
      req = { params: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return appropriate [200] when the toggle is successfully fetched', async () => {
      req.params.toggle_name = 'testToggle';
      
      const expectedToggle = { 
        name: 'testToggle', 
        enabled: true, 
        description: 'Test toggle'
      };
      
      (toggleService.getToggleByName as jest.Mock).mockResolvedValue(expectedToggle);

      await getToggle(req, res);

      expect(toggleService.getToggleByName).toHaveBeenCalledWith('testToggle');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedToggle);
    });

    it('should return appropriate [404] when the toggle is not found', async () => {
      req.params.toggle_name = 'testToggle_2';
      
      (toggleService.getToggleByName as jest.Mock).mockResolvedValue(null);

      await getToggle(req, res);

      expect(toggleService.getToggleByName).toHaveBeenCalledWith('testToggle_2');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Toggle not found" });
    });

    it('should return appropriate [500] when getting toggle fails', async () => {
      req.params.toggle_name = 'testToggle';

      const mockError = new Error('An error occurred while fetching toggle; please try again later');

      (toggleService.getToggleByName as jest.Mock).mockRejectedValue(mockError);

      await getToggle(req, res);

      expect(toggleService.getToggleByName).toHaveBeenCalledWith('testToggle');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('addToggle function', () => {
    beforeEach(() => {
      req = {
        body: {
          name: 'testToggle_2', 
          enabled: false, 
          description: 'Test toggle_2'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return appropriate [201] when the toggle is successfully added', async () => {
      const newToggle = { 
        name: 'testToggle_2', 
        enabled: false, 
        description: 'Test toggle_2'
      };
      
      (toggleService.addToggle as jest.Mock).mockResolvedValue(newToggle);

      await addToggle(req, res);

      expect(toggleService.addToggle).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newToggle);
    });

    it('should return appropriate [500] when adding toggle fails', async () => {
      const mockError = new Error('An error occurred while adding toggle; please try again later');

      (toggleService.addToggle as jest.Mock).mockRejectedValue(mockError);

      await addToggle(req, res);

      expect(toggleService.addToggle).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('updateToggle function', () => {
    beforeEach(() => {
      req = {
        body: {
          name: 'testToggle', 
          enabled: false, 
          description: 'Test toggle'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return appropriate [200] when the corresponding toggle is successfully updated', async () => {
      const updatedToggle = { 
        name: 'testToggle', 
        enabled: false, 
        description: 'Test toggle'
      };
      
      (toggleService.updateToggle as jest.Mock).mockResolvedValue(updatedToggle);

      await updateToggle(req, res);

      expect(toggleService.updateToggle).toHaveBeenCalledWith('testToggle', false, 'Test toggle');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedToggle);
    });

    it('should return appropriate [500] when updating toggle fails', async () => {
      const mockError = new Error('An error occurred while updating toggle; please try again later');

      (toggleService.updateToggle as jest.Mock).mockRejectedValue(mockError);

      await updateToggle(req, res);

      expect(toggleService.updateToggle).toHaveBeenCalledWith('testToggle', false, 'Test toggle');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('deleteToggle function', () => {
    beforeEach(() => {
      req = { params: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return appropriate [200] when the toggle is successfully deleted', async () => {
      req.params.toggle_name = 'testToggle';
      
      const deletedToggle = { 
        name: 'testToggle', 
        enabled: true, 
        description: 'Test toggle'
      };
      
      (toggleService.deleteToggleByName as jest.Mock).mockResolvedValue(deletedToggle);

      await deleteToggle(req, res);

      expect(toggleService.deleteToggleByName).toHaveBeenCalledWith('testToggle');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Toggle successfully deleted' });
    });

    it('should return appropriate [404] when the toggle is not found', async () => {
      req.params.toggle_name = 'testToggle_2';
      
      (toggleService.deleteToggleByName as jest.Mock).mockResolvedValue(null);

      await deleteToggle(req, res);

      expect(toggleService.deleteToggleByName).toHaveBeenCalledWith('testToggle_2');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Toggle not found" });
    });

    it('should return appropriate [500] when deleting toggle fails', async () => {
      req.params.toggle_name = 'testToggle';

      const mockError = new Error('An error occurred while deleting toggle; please try again later');

      (toggleService.deleteToggleByName as jest.Mock).mockRejectedValue(mockError);

      await deleteToggle(req, res);

      expect(toggleService.deleteToggleByName).toHaveBeenCalledWith('testToggle');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
