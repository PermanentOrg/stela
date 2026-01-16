import {
	getOriginalFileIdFromInformationPackagePath,
	triggerArchivematicaProcessing,
} from "./index";

global.fetch = jest.fn();

describe("getFileIdFromInformationPackagePath", () => {
	test("should return the file ID if the file ID is a number", () => {
		const fileId = getOriginalFileIdFromInformationPackagePath(
			"access_copies/1beb/41dc/92a9/4d47/a274/8f24/b1ed/d199/37_upload-05c83751-bdf9-4c0b-b37d-25bed5177853/thumbnails/2d31697a-39e5-47db-8d79-a1e6ceae0613.jpg",
		);
		expect(fileId).toEqual("37");
	});

	test("should return the file ID if the file ID is a uuid", () => {
		const fileId = getOriginalFileIdFromInformationPackagePath(
			"access_copies/1beb/41dc/92a9/4d47/a274/8f24/b1ed/d199/346c2cb4-1d10-4eda-a2e0-73836df3c3d6_upload-05c83751-bdf9-4c0b-b37d-25bed5177853/thumbnails/2d31697a-39e5-47db-8d79-a1e6ceae0613.jpg",
		);
		expect(fileId).toEqual("346c2cb4-1d10-4eda-a2e0-73836df3c3d6");
	});

	test("should throw an error if no file ID can be found in the path", () => {
		let error = null;
		try {
			getOriginalFileIdFromInformationPackagePath("malformed_path");
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});

describe("triggerArchivematicaProcessing", () => {
	test("should call Archivematica correctly", async () => {
		const testFileId = "1";
		const testFilePath = "originals/1/1";

		await triggerArchivematicaProcessing(testFileId, testFilePath, {
			archivematicaHostUrl: "https://example.com",
			archivematicaApiKey: "test-api-key",
			archivematicaOriginalLocationId: "3f896582-06b5-4cfa-bb0b-f2c32879d615",
			processingWorkflow: "default",
		});

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/api/v2beta/package",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "ApiKey test-api-key",
				},
				body: JSON.stringify({
					name: "1_upload",
					type: "standard",
					processing_config: "default",
					accession: "",
					access_system_id: "",
					auto_approve: true,
					metadata_set_id: "",
					path: Buffer.from(
						"3f896582-06b5-4cfa-bb0b-f2c32879d615:originals/1",
						"utf-8",
					).toString("base64"),
				}),
			},
		);
	});
	test("should error if the file is located in the root directory of its cloud storage", async () => {
		const testFileId = "1";
		const testFilePath = "1";

		await expect(
			triggerArchivematicaProcessing(testFileId, testFilePath, {
				archivematicaHostUrl: "https://example.com",
				archivematicaApiKey: "test-api-key",
				archivematicaOriginalLocationId: "3f896582-06b5-4cfa-bb0b-f2c32879d615",
				processingWorkflow: "default",
			}),
		).rejects.toThrow(
			new Error(
				"Invalid cloud path: file must be located in a non-root directory",
			),
		);
	});
});
