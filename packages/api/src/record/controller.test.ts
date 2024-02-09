import request from "supertest";
import { app } from "../app";

fdescribe("record/get", () => {
  const agent = request(app);
  test("expect a 401 response", async () => {
    await agent.get("/api/v2/record/get").expect(401);
  });
});
