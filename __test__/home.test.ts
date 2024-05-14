import request from "supertest";
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals";
import app from "../src/utils/app";


describe("Testing home page", () => {
    test("Testing home page", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("server is running");
    });
  });