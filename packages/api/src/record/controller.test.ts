import { app } from "../app";
import request from "supertest";

fdescribe("record/get", () => {
  const agent = request(app);
  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/record/get").end((err, res) => {
      expect(res.status).not.toBe(404);
    });
  });
});
