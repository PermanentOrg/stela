import { legacyClient } from "./legacy_client";

global.fetch = jest.fn();

describe("transferArchiveOwnership", () => {
	test("should submit the correct request", async () => {
		const testEmail = "test@permanent.org";
		const archiveSlug = "0001-0001";
		const testMessage = "Please carry on the mission of this archive";

		await legacyClient.transferArchiveOwnership(
			testEmail,
			archiveSlug,
			testMessage,
			true,
			1024,
		);

		expect(fetch).toHaveBeenCalledWith("/archive/transferOwnership", {
			method: "POST",
			headers: {
				"Request-Version": "2",
				"Content-Type": "application/json",
				"X-Permanent-Stela-Shared-Secret": "",
			},
			body: JSON.stringify({
				recipientEmail: testEmail,
				archiveNbr: archiveSlug,
				storageGiftInMB: 1024,
				isLegacyAction: true,
				message: testMessage,
			}),
		});
	});
	test("should use the correct defaults for optional arguments", async () => {
		const testEmail = "test@permanent.org";
		const archiveSlug = "0001-0001";

		await legacyClient.transferArchiveOwnership(testEmail, archiveSlug);

		expect(fetch).toHaveBeenCalledWith("/archive/transferOwnership", {
			method: "POST",
			headers: {
				"Request-Version": "2",
				"Content-Type": "application/json",
				"X-Permanent-Stela-Shared-Secret": "",
			},
			body: JSON.stringify({
				recipientEmail: testEmail,
				archiveNbr: archiveSlug,
				storageGiftInMB: 0,
				isLegacyAction: false,
				message: null,
			}),
		});
	});
});
