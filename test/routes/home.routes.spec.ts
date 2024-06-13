import request from "supertest";
import app from "../../src/utils/app";

describe("Successful request", () => {
  it('should return a 200 status and a message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Server is running' });
  });
});
