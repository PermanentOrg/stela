import * as Sentry from "@sentry/node";
import { cleanupDashboard } from "./service";

jest.mock("@sentry/node");

describe("cleanupDashboard", () => {
	afterEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});
	test("should call fetch with the correct arguments", async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
		});
		await cleanupDashboard();
		expect(global.fetch).toHaveBeenNthCalledWith(
			1,
			`${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/transfer/delete`,
			{
				method: "DELETE",
				headers: {
					Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
				},
			},
		);
		expect(global.fetch).toHaveBeenNthCalledWith(
			2,
			`${process.env["ARCHIVEMATICA_BASE_URL"] ?? ""}/api/ingest/delete`,
			{
				method: "DELETE",
				headers: {
					Authorization: `ApiKey ${process.env["ARCHIVEMATICA_API_KEY"] ?? ""}`,
				},
			},
		);
	});

	test("should log an error to sentry if the transfer deletion fails", async () => {
		const errorText = "500 Internal Server Error";
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			text: async () => await Promise.resolve(errorText),
		});

		await cleanupDashboard();
		expect(Sentry.captureMessage).toHaveBeenCalledWith(errorText);
	});

	test("should log an error to sentry if the ingest deletion fails", async () => {
		const errorText = "500 Internal Server Error";
		global.fetch = jest
			.fn()
			.mockResolvedValueOnce({
				ok: true,
			})
			.mockResolvedValueOnce({
				ok: false,
				text: async () => await Promise.resolve(errorText),
			});

		await cleanupDashboard();
		expect(Sentry.captureMessage).toHaveBeenCalledWith(errorText);
	});
});
