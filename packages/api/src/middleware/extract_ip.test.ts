import type { Request, Response } from "express";
import { extractIp } from "./extract_ip";

describe("extractIp", () => {
  test("should extract the IP from a request", () => {
    const testIp = "192.168.0.1";
    const request = {
      body: {},
      get: (_: string) => testIp,
    } as Request as Request<
      unknown,
      unknown,
      Record<string, string | undefined>
    >;
    extractIp(request, {} as Response, () => {});

    expect(request.body["ip"]).toBe(testIp);
  });
});
