import request from "supertest";
import { app } from "../app";

fdescribe("record/get", () => {
  const agent = request(app);
  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/record/get").end((_, res) => {
      expect(res.status).not.toBe(404);
    });
  });
});
