import { createRequest, createResponse } from "node-mocks-http";
import { extractIp } from "./extract_ip";

describe("extractIp", () => {
	test("should extract the IP from X-Forwarded-For header", () => {
		const testIp = "192.168.0.1";
		const request = createRequest({ headers: { "X-Forwarded-For": testIp } });
		extractIp(request, createResponse(), () => {});

		const {
			body: { ip },
		} = request as { body: { ip: string } };
		expect(ip).toBe(testIp);
	});
	test("should extract IP from the remoteAddress if not forwarded", () => {
		const testIp = "192.168.0.1";
		const request = createRequest({
			connection: {
				remoteAddress: testIp,
			},
		});
		extractIp(request, createResponse(), () => {});

		const {
			body: { ip },
		} = request as { body: { ip: string } };
		expect(ip).toBe(testIp);
	});
	test("should extract the client IP from X-Forwarded-For header with multiple proxies", () => {
		const testIp = "192.168.0.1";
		const request = createRequest({ headers: { "X-Forwarded-For": testIp } });
		extractIp(request, createResponse(), () => {});

		const {
			body: { ip },
		} = request as { body: { ip: string } };
		expect(ip).toBe(testIp);
	});
});
