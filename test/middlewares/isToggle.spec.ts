import { NextFunction, Request, Response } from "express";
import { isToggle } from "../../src/middlewares/isToggle";
import Toggle from "../../src/models/misc/Toggle";

describe("isToggle function", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should pass middleware if expected toggle is enabled", async () => {
    const middleware = isToggle("testToggle_1");
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  
  it("should return 403 if expected toggle is disabled", async () => {
    const middleware = isToggle("testToggle");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Feature is currently disabled",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if expected toggle is not found", async () => {
    const middleware = isToggle("testToggle_nonExisting");
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Feature is currently disabled",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 if an exception occurs", async () => {
    const toggleName = "testToggle_nonExisting";
    const mockError = new Error(`Failed to fetch toggle ${ toggleName }; please try again later`);
    
    const findOneSpy = jest.spyOn(Toggle, 'findOne').mockRejectedValue(mockError);
    
    const middleware = isToggle(toggleName);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to determine feature state; please try again later',
    });
    expect(next).not.toHaveBeenCalled();

    // Restore original method to avoid affecting other tests
    findOneSpy.mockRestore();
  });
});