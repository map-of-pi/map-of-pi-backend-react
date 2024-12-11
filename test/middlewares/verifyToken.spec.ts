import { verifyAdminToken } from "../../src/middlewares/verifyToken";

describe("verifyAdminToken function", () => {
  let req: any;
  let res: any;
  let mockNext: jest.Mock;

  process.env.ADMIN_API_USERNAME = "validUsername";
  process.env.ADMIN_API_PASSWORD = "validPassword";

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn();
  });

  it("should return 401 if no admin credentials are provided", () => {
    verifyAdminToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 if incorrect admin credentials are provided", () => {
    req.headers.authorization = `Basic ${Buffer.from("invalidUsername:invalidPassword").toString("base64")}`;
    
    verifyAdminToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should pass middleware if admin credentials are valid", () => {
    req.headers.authorization = `Basic ${Buffer.from("validUsername:validPassword").toString("base64")}`;

    verifyAdminToken(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});