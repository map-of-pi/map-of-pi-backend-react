import { getSanctionedSellersReport } from '../../../src/controllers/admin/reportsController';
import * as reportService from '../../../src/services/admin/report.service';

jest.mock('../../../src/services/admin/report.service', () => ({
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
        { seller_id: '0f0f0f-0f0f-0f0f', name: 'Test Seller Sanctioned 6', address: 'Sanctioned Region Cuba', sanctioned_location: 'Cuba' },
        { seller_id: '0g0g0g-0g0g-0g0g', name: 'Test Seller Sanctioned 7', address: 'Sanctioned Region Iran', sanctioned_location: 'Iran' },
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
