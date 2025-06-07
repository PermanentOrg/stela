import nock from "nock";
import { fusionAuthClient } from "./fusionauth";

const mockFusionAuthHost = process.env["FUSIONAUTH_HOST"] || "";

describe("fusionAuthClient", () => {
	describe("introspectAccessToken", () => {
		afterEach(() => {
			fusionAuthClient.introspectAccessToken.clear();
			nock.cleanAll();
		});
		test("should correctly make a network call the first time a unique set of parameters are passed", async () => {
			const mockFusionAuthService = nock(mockFusionAuthHost)
				.post(/.*/)
				.times(1)
				.reply(200);
			await fusionAuthClient.introspectAccessToken(
				"appId",
				"ThisIsTotallyAToken",
			);
			expect(mockFusionAuthService.isDone()).toBe(true);
		});
		test("should correctly make additional network calls when distinct parameters are passed", async () => {
			const mockFusionAuthService = nock(mockFusionAuthHost)
				.post(/.*/)
				.times(2)
				.reply(200);
			await fusionAuthClient.introspectAccessToken(
				"appIdFoo",
				"ThisIsTotallyAToken",
			);
			await fusionAuthClient.introspectAccessToken(
				"appIdBar",
				"ThisIsTotallyAToken",
			);
			expect(mockFusionAuthService.isDone()).toBe(true);
		});
		test("should NOT make a network call, and should use the cached result, when identical parameters are passed", async () => {
			const mockFusionAuthService = nock(mockFusionAuthHost)
				.post(/.*/)
				.times(1)
				.reply(200);
			await fusionAuthClient.introspectAccessToken(
				"appIdFoo",
				"ThisIsTotallyAToken",
			);
			await fusionAuthClient.introspectAccessToken(
				"appIdFoo",
				"ThisIsTotallyAToken",
			);
			expect(mockFusionAuthService.isDone()).toBe(true);
		});
	});
});
