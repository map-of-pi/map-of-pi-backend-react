import { deleteOrder } from '../../src/controllers/orderController';
import * as orderService from '../../src/services/order.service';

jest.mock('../../src/services/order.service', () => ({
  getAllOrders: jest.fn(),
  getSellerOrdersById: jest.fn(),
  getOrderItems: jest.fn(),
  addOrUpdateOrder: jest.fn(),
  updateOrderItemStatus: jest.fn(),
  deleteOrderById: jest.fn()
}));

describe('orderController', () => {
  let req: any;
  let res: any;

  describe('deleteOrder function', () => {
    beforeEach(() => {
      req = { 
        params: { order_id: '26f5a0f2a86d1f9f3b7e4e81' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it('should return appropriate [200] when the order is deleted successfully', async () => {
      const expectedOrder = { _id: "25f5a0f2a86d1f9f3b7e4e82" };
      
      (orderService.deleteOrderById as jest.Mock).mockResolvedValue(expectedOrder);
      
      await deleteOrder(req, res);

      expect(orderService.deleteOrderById).toHaveBeenCalledWith('26f5a0f2a86d1f9f3b7e4e81');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Order deleted successfully", 
        deletedOrder: expectedOrder 
      });
    });

    it('should return appropriate [404] if order is not found', async () => {
      (orderService.deleteOrderById as jest.Mock).mockResolvedValue(null);
  
      await deleteOrder(req, res);
  
      expect(orderService.deleteOrderById).toHaveBeenCalledWith('26f5a0f2a86d1f9f3b7e4e81');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
    });

    it('should return appropriate [500] when deleting order fails', async () => {
      const mockError = new Error('An error occurred while deleting order; please try again later');
      
      (orderService.deleteOrderById as jest.Mock).mockRejectedValue(mockError);
      
      await deleteOrder(req, res);
  
      expect(orderService.deleteOrderById).toHaveBeenCalledWith('26f5a0f2a86d1f9f3b7e4e81');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});