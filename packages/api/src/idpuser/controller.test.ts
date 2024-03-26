import request from "supertest";
import { app } from "../app";

describe("/idpuser", () => {
  const agent = request(app);
  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/idpuser").end((res) => {
      expect(res.status).not.toBe(404);
    });
  });  
});
