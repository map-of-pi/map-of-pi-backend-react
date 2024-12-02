import { getSanctionedSellersReport } from '../../src/controllers/reportsController';
import * as reportService from '../../src/services/report.service';

jest.mock('../../src/services/report.service', () => ({
  reportSanctionedSellers: jest.fn(),
}));

describe('ReportsController', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getSanctionedSellersReport function', () => {
    it('should get report for sanctioned sellers and return successful message', async () => {
      const expectedSanctionedSellers = [
        { seller_id: '0a0a0a-0a0a-0a0a', name: 'Test Seller 1', sanctioned_location: 'Location 1' },
        { seller_id: '0d0d0d-0d0d-0d0d', name: 'Test Seller 4', sanctioned_location: 'Location 1' },
      ];

      (reportService.reportSanctionedSellers as jest.Mock).mockResolvedValue(expectedSanctionedSellers);

      await getSanctionedSellersReport(req, res);
      expect(reportService.reportSanctionedSellers).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `${expectedSanctionedSellers.length} Sanctioned seller(s) retrieved successfully`,
        sanctionedSellers: expectedSanctionedSellers,
      });
    });

    it('should return appropriate [500] if get sanctioned sellers report fails', async () => {
      const mockError = new Error('An error occurred while generating Sanctioned Sellers Report; please try again later');

      (reportService.reportSanctionedSellers as jest.Mock).mockRejectedValue(mockError);

      await getSanctionedSellersReport(req, res);

      expect(reportService.reportSanctionedSellers).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});
