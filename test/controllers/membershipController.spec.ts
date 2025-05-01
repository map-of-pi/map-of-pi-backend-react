import { getSingleMembership, manageMembership } from '../../src/controllers/membershipController';
import * as membershipService from '../../src/services/membership.service';

jest.mock('../../src/services/membership.service', () => ({
  getSingleMembershipById: jest.fn(),
  addOrUpdateMembership: jest.fn()
}));

describe('membershipController', () => {
  let req: any;
  let res: any;

  describe('getSingleMembership function', () => {
    beforeEach(() => {
      req = { 
        params: {} 
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when the membership exists', async () => {
      req.params.membership_id = '0a0a0a-0a0a-0a0a';

      const expectedMembership = [
        {
          membership_id: "0a0a0a-0a0a-0a0a",
          membership_class: "Triple Gold",
          membership_end_date: "2026-01-26T00:00:00.000Z",
          mappi_balance: 1000
        }
      ];
      
      (membershipService.getSingleMembershipById as jest.Mock).mockResolvedValue(expectedMembership);
      
      await getSingleMembership(req, res);

      expect(membershipService.getSingleMembershipById).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedMembership);
    });

    it('should return appropriate [404] when the membership does not exist', async () => {
      req.params.membership_id = '0b0b0b-0b0b-0b0b';
      
      (membershipService.getSingleMembershipById as jest.Mock).mockResolvedValue(null);
      
      await getSingleMembership(req, res);

      expect(membershipService.getSingleMembershipById).toHaveBeenCalledWith('0b0b0b-0b0b-0b0b');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Membership not found" });
    });

    it('should return appropriate [500] when getting single membership fails', async () => {
      req.params.membership_id = '0a0a0a-0a0a-0a0a';

      const mockError = new Error('An error occurred while getting single membership; please try again later');

      (membershipService.getSingleMembershipById as jest.Mock).mockRejectedValue(mockError);

      await getSingleMembership(req, res);

      expect(membershipService.getSingleMembershipById).toHaveBeenCalledWith('0a0a0a-0a0a-0a0a');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });

  describe('manageMembership function', () => {
    beforeEach(() => {
      req = { 
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when the membership is managed successfully', async () => {
      req.currentUser = {
        pi_uid: "'0c0c0c-0c0c-0c0c"
      }
      req.body = {
        membership_class: "Gold",
        membership_duration: 10,
        mappi_allowance: 100
      };
      const expectedMembershipData = {
        currentUser: { pi_uid: "0c0c0c-0c0c-0c0c" },
        membership_class: "Gold",
        membership_expiry_date: "2025-04-21T00:00:00.000Z",
        mappi_balance: 1000
      };
      
      (membershipService.addOrUpdateMembership as jest.Mock).mockResolvedValue(expectedMembershipData);
      
      await manageMembership(req, res);

      expect(membershipService.addOrUpdateMembership).toHaveBeenCalledWith(
        req.currentUser, 
        req.body.membership_class,
        req.body.membership_duration,
        req.body.mappi_allowance
        );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedMembershipData);
    });

    it('should return appropriate [500] when managing membership fails', async () => {
      req.currentUser = {
        pi_uid: "0d0d0d-0d0d-0d0d"
      }
      req.body = {
        membership_class: "Gold",
        membership_duration: 10,
        mappi_allowance: 100
      };
      
      const mockError = new Error('An error occurred while managing membership; please try again later');
      
      (membershipService.addOrUpdateMembership as jest.Mock).mockRejectedValue(mockError);
      
      await manageMembership(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});