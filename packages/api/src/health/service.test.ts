import { db } from "../database";
import { healthService } from "./service";

jest.mock("../database");

test("should be available when DB connection works", async () => {
  const result = await healthService.getHealth();
  expect(result).toBe("available");
});

test("should be unavailable when DB connection fails", async () => {
  jest.spyOn(db, "sql").mockImplementation(() => {
    throw new Error();
  });

  const result = await healthService.getHealth();
  expect(result).toBe("unavailable");
});
