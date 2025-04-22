import request from "supertest";
import { app } from "../app";
import { db } from "../database";

jest.mock("../database");

describe("/health", () => {
	const agent = request(app);

	test("should be available when DB connection works", async () => {
		const result = await agent.get("/api/v2/health").expect(200);
		expect(
			(result.body as { status: "available" | "unavailable" }).status,
		).toBe("available");
	});

	test("should be unavailable when DB connection fails", async () => {
		jest.spyOn(db, "sql").mockImplementation(() => {
			throw new Error();
		});

		const result = await agent.get("/api/v2/health").expect(200);
		expect(
			(result.body as { status: "available" | "unavailable" }).status,
		).toBe("unavailable");
	});
});
