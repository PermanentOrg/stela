import request from "supertest";

describe("/idpuser", () => {
  const agent = request(app);
  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/idpuser").end((err, res) => {
      expect(res.status).not.toBe(404);
    });
  });  
});
