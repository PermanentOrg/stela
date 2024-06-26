import type { Request, Response } from "express";
import { extractIp } from "./extract_ip";

describe("extractIp", () => {
  test("should extract the IP from X-Forwarded-For header", () => {
    const testIp = "192.168.0.1";
    const request = {
      body: {},
      get: (str: string) => (str === "X-Forwarded-For" ? testIp : undefined),
    } as Request as Request<
      unknown,
      unknown,
      Record<string, string | undefined>
    >;
    extractIp(request, {} as Response, () => {});

    expect(request.body["ip"]).toBe(testIp);
  });
  test("should extract IP from the remoteAddress if not forwarded", () => {
    const testIp = "192.168.0.1";
    const request = {
      body: {},
      connection: {
        remoteAddress: testIp,
      },
      get: (_: string) => undefined,
    } as unknown as Request<
      unknown,
      unknown,
      Record<string, string | undefined>
    >;
    extractIp(request, {} as Response, () => {});

    expect(request.body["ip"]).toBe(testIp);
  });
  test("should extract the client IP from X-Forwarded-For header with multiple proxies", () => {
    const testIp = "192.168.0.1";
    const request = {
      body: {},
      get: (_: string) => `${testIp},192.168.0.2,192.168.0.3`,
    } as Request as Request<
      unknown,
      unknown,
      Record<string, string | undefined>
    >;
    extractIp(request, {} as Response, () => {});

    expect(request.body["ip"]).toBe(testIp);
  });
});
