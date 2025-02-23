import { createSanctionedRegion, getRestrictedAreaMetrics } from '../../../../src/controllers/admin/metrics/reportsMetricsController';
import { RestrictedArea } from '../../../../src/models/enums/restrictedArea';
import * as reportMetricsService from '../../../../src/services/misc/metrics/reportMetrics.service';

jest.mock('../../../../src/services/misc/metrics/reportMetrics.service', () => ({
  getAllRestrictedAreas: jest.fn(),
  addSanctionedRegion: jest.fn()
}));

describe('ReportsMetricsController', () => {
  let req: any;
  let res: any;

  describe('getRestrictedAreaMetrics function', () => {
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when restricted area metrics is successfully retrieved', async () => {
      const expectedRestrictedAreas = [
        { location: RestrictedArea.CUBA },
        { location: RestrictedArea.IRAN },
      ];

      (reportMetricsService.getAllRestrictedAreas as jest.Mock).mockResolvedValue(expectedRestrictedAreas);

      await getRestrictedAreaMetrics(req, res);

      expect(reportMetricsService.getAllRestrictedAreas).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ restrictedAreas: expectedRestrictedAreas });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while fetching restricted areas');

      (reportMetricsService.getAllRestrictedAreas as jest.Mock).mockRejectedValue(mockError);

      await getRestrictedAreaMetrics(req, res);

      expect(reportMetricsService.getAllRestrictedAreas).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message,
        error: mockError
      });
    });
  });

  describe('createSanctionedRegion function', () => {
    beforeEach(() => {
      req = {
        body: {
          location: 'New Sanctioned Region',
          boundary: {
            coordinates: [[[100.50, 100.50]]] 
          }
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [201] when sanctioned area is successfully created', async () => {
      const expectedNewSanctionedRegion = { 
        location: req.body.location, 
        boundary: req.body.boundary 
      };

      (reportMetricsService.addSanctionedRegion as jest.Mock).mockResolvedValue(expectedNewSanctionedRegion);

      await createSanctionedRegion(req, res);

      expect(reportMetricsService.addSanctionedRegion).toHaveBeenCalledWith(
        req.body.location,
        req.body.boundary
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true,
        message: 'Sanctioned region created successfully',
        data: expectedNewSanctionedRegion });
    });

    it('should return appropriate [500] for an internal server error', async () => {
      const mockError = new Error('An error occurred while creating sanctioned region');

      (reportMetricsService.addSanctionedRegion as jest.Mock).mockRejectedValue(mockError);

      await createSanctionedRegion(req, res);

      expect(reportMetricsService.addSanctionedRegion).toHaveBeenCalledWith(
        req.body.location,
        req.body.boundary
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false,
        message: mockError.message,
        error: mockError 
      });
    });
  });
});
