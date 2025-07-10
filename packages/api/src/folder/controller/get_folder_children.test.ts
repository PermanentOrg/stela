import request from "supertest";
import type { Folder } from "../models";
import type { ArchiveRecord, ArchiveFile } from "../../record/models";
import type { Tag } from "../../tag/models";
import type { Share } from "../../share/models";
import { app } from "../../app";
import {
	extractUserEmailFromAuthToken,
	extractShareTokenFromHeaders,
} from "../../middleware";
import {
	mockExtractUserEmailFromAuthToken,
	mockExtractShareTokenFromHeaders,
} from "../../../test/middleware_mocks";
import { loadFixtures, clearDatabase } from "./utils_test";
import { db } from "../../database";

jest.mock("../../database");
jest.mock("../../middleware");

describe("GET /folder/{id}/children", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockExtractUserEmailFromAuthToken("test@permanent.org");
		mockExtractShareTokenFromHeaders();

		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should return 200 on a valid request", async () => {
		await agent.get("/api/v2/folder/1/children?pageSize=100").expect(200);
	});

	test("should call extractUserEmailFromAuthToken middleware", async () => {
		await agent.get("/api/v2/folder/1/children?pageSize=100").expect(200);
		expect(extractUserEmailFromAuthToken).toHaveBeenCalled();
	});

	test("should call extractShareTokenFromHeaders middleware", async () => {
		await agent.get("/api/v2/folder/1/children?pageSize=100").expect(200);
		expect(extractShareTokenFromHeaders).toHaveBeenCalled();
	});

	test("should return 400 code if the header values are invalid", async () => {
		mockExtractUserEmailFromAuthToken("not_an_email");
		await agent.get("/api/v2/folder/1/children").expect(400);
	});

	test("should return 400 code if the query parameters are invalid", async () => {
		await agent.get("/api/v2/folder/1/children?cursor=1").expect(400);
	});

	test("should return the whole folder object", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		const [folder] = children;

		if (folder !== undefined) {
			expect("folderId" in folder).toBe(true);
			if ("folderId" in folder) {
				expect(folder.folderId).toEqual("2");
				expect(folder.size).toEqual(0);
				expect(folder.location?.id).toEqual("1");
				expect(folder.location?.streetNumber).toEqual("55");
				expect(folder.location?.streetName).toEqual("Rue Plumet");
				expect(folder.location?.locality).toEqual("Paris");
				expect(folder.location?.county).toEqual("Ile-de-France");
				expect(folder.location?.state).toBeNull();
				expect(folder.location?.latitude).toEqual(48.838608548520966);
				expect(folder.location?.longitude).toEqual(2.3069214988665303);
				expect(folder.location?.country).toEqual("France");
				expect(folder.location?.countryCode).toEqual("FR");
				expect(folder.location?.displayName).toEqual("Jean Valjean's House");
				expect(folder.parentFolder?.id).toEqual("10");
				expect(folder.shares?.length).toEqual(1);
				if (folder.shares?.length === 1) {
					expect(folder.shares[0]?.id).toEqual("1");
					expect(folder.shares[0]?.accessRole).toEqual("access.role.curator");
					expect(folder.shares[0]?.status).toEqual("status.generic.ok");
					expect(folder.shares[0]?.archive.id).toEqual("2");
					expect(folder.shares[0]?.archive.thumbUrl200).toEqual(
						"https://test-archive-thumbnail",
					);
					expect(folder.shares[0]?.archive.name).toEqual("Test Archive");
				}
				expect(folder.tags?.length).toEqual(1);
				if (folder.tags?.length === 1) {
					expect(folder.tags[0]?.id).toEqual("1");
					expect(folder.tags[0]?.name).toEqual("Test Tag One");
					expect(folder.tags[0]?.type).toEqual("type.generic.placeholder");
				}
				expect(folder.archive.id).toEqual("1");
				expect(folder.createdAt).toEqual("2025-01-01T00:00:00.000Z");
				expect(folder.updatedAt).toEqual("2025-01-01T00:00:00.000Z");
				expect(folder.description).toEqual("A test folder");
				expect(folder.displayTimestamp).toEqual("2025-01-01T00:00:00.000Z");
				expect(folder.displayEndTimestamp).toEqual("2025-01-01T00:00:00.000Z");
				expect(folder.displayName).toEqual("Private Folder");
				expect(folder.downloadName).toEqual("Private Folder");
				expect(folder.imageRatio).toEqual(1);
				expect(folder.paths.names.length).toEqual(2);
				expect(folder.paths.names[0]).toEqual("My Files");
				expect(folder.paths.names[1]).toEqual("Private Folder");
				expect(folder.publicAt).toBeNull();
				expect(folder.sort).toEqual("alphabetical-ascending");
				expect(folder.thumbnailUrls).toBeDefined();
				if (folder.thumbnailUrls !== undefined) {
					expect(folder.thumbnailUrls["200"]).toEqual(
						"https://test-folder-thumbnail-200",
					);
					expect(folder.thumbnailUrls["256"]).toEqual(
						"https://test-folder-thumbnail-256",
					);
					expect(folder.thumbnailUrls["500"]).toEqual(
						"https://test-folder-thumbnail-500",
					);
					expect(folder.thumbnailUrls["1000"]).toEqual(
						"https://test-folder-thumbnail-1000",
					);
					expect(folder.thumbnailUrls["2000"]).toEqual(
						"https://test-folder-thumbnail-2000",
					);
				}
				expect(folder.type).toEqual("private");
				expect(folder.status).toEqual("ok");
				expect(folder.view).toEqual("grid");
			}
		}
	});

	test("should return the whole record object", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		const [, record] = children;
		if (record !== undefined) {
			expect("recordId" in record);
			if ("recordId" in record) {
				expect(record.recordId).toEqual("8");
				expect(record.displayName).toEqual("Public File");
				expect(record.archiveId).toEqual("1");
				expect(record.archiveNumber).toEqual("0000-0008");
				expect(record.publicAt).toEqual("2023-06-21T00:00:00.000Z");
				expect(record.description).toEqual("A description of the image");
				expect(record.downloadName).toEqual("public_file.jpg");
				expect(record.uploadFileName).toEqual("public_file.jpg");
				expect(record.uploadAccountId).toEqual("2");
				expect(record.uploadPayerAccountId).toEqual("2");
				expect(record.size).toEqual(1024);
				expect(record.displayDate).toEqual("2023-06-21T00:00:00.000Z");
				expect(record.fileCreatedAt).toEqual("2023-06-21T00:00:00.000Z");
				expect(record.imageRatio).toEqual(1);
				expect(record.thumbUrl200).toEqual(
					"https://localcdn.permanent.org/8/thumb200.jpg",
				);
				expect(record.thumbUrl500).toEqual(
					"https://localcdn.permanent.org/8/thumb500.jpg",
				);
				expect(record.thumbUrl1000).toEqual(
					"https://localcdn.permanent.org/8/thumb1000.jpg",
				);
				expect(record.thumbUrl2000).toEqual(
					"https://localcdn.permanent.org/8/thumb2000.jpg",
				);
				expect(record.status).toEqual("status.generic.ok");
				expect(record.type).toEqual("type.record.image");
				expect(record.createdAt).toEqual("2023-06-21T00:00:00.000Z");
				expect(record.updatedAt).toEqual("2023-06-21T00:00:00.000Z");
				expect(record.altText).toEqual("An image");
				expect(record.files.length).toEqual(2);
				const originalFile = record.files.find(
					(file: ArchiveFile) => file.fileId === "8",
				);
				const convertedFile = record.files.find(
					(file: ArchiveFile) => file.fileId === "9",
				);
				expect(originalFile).toBeTruthy();
				expect(convertedFile).toBeTruthy();
				expect(originalFile?.size).toEqual(1024);
				expect(convertedFile?.size).toEqual(2056);
				expect(originalFile?.format).toEqual("file.format.original");
				expect(convertedFile?.format).toEqual("file.format.converted");
				expect(originalFile?.type).toEqual("type.file.image.png");
				expect(convertedFile?.type).toEqual("type.file.image.jpg");
				expect(originalFile?.fileUrl).toEqual(
					"https://localcdn.permanent.org/_Dev/8?t=1732914102&Expires=1732914102&Signature=AmCIgw__&Key-Pair-Id=APKA",
				);
				expect(originalFile?.downloadUrl).toEqual(
					"https://localcdn.permanent.org/_Dev/8?t=1732914102&response-content-disposition=attachment%3B+filename%3D%22Robert+birthday+%281%29.jpg%22&Expires=1732914102&Signature=R25~ODA0uZ77J2rjQ__&Key-Pair-Id=APKA",
				);

				expect(record.folderLinkId).toEqual("11");
				expect(record.folderLinkType).toEqual("type.folder_link.private");
				expect(record.parentFolderId).toEqual("10");
				expect(record.parentFolderLinkId).toEqual("10");
				expect(record.parentFolderArchiveNumber).toEqual("0001-0010");
				expect(record.tags.length).toEqual(3);
				const firstTag = record.tags.find((tag: Tag) => tag.id === "14");
				const secondTag = record.tags.find((tag: Tag) => tag.id === "15");
				const thirdTag = record.tags.find((tag: Tag) => tag.id === "16");
				expect(firstTag?.name).toEqual("Generic Tag 1");
				expect(secondTag?.name).toEqual("Generic Tag 2");
				expect(thirdTag?.name).toEqual("Generic Tag 3");
				expect(firstTag?.type).toEqual("type.generic.placeholder");
				expect(secondTag?.type).toEqual("type.generic.placeholder");
				expect(thirdTag?.type).toEqual("type.tag.metadata.CustomField");

				expect(record.archiveArchiveNumber).toEqual("0001-0001");

				expect(record.shares.length).toEqual(2);
				const shareViewer = record.shares.find(
					(share: Share) => share.id === "3",
				);
				const shareContributor = record.shares.find(
					(share: Share) => share.id === "4",
				);
				expect(shareViewer?.accessRole).toEqual("access.role.viewer");
				expect(shareViewer?.status).toEqual("status.generic.ok");
				expect(shareViewer?.archive.id).toEqual("3");
				expect(shareViewer?.archive.thumbUrl200).toEqual(
					"https://test-archive-thumbnail",
				);
				expect(shareViewer?.archive.name).toEqual("Test Archive");

				expect(shareContributor?.accessRole).toEqual("access.role.contributor");
				expect(shareContributor?.status).toEqual("status.generic.ok");
				expect(shareContributor?.archive.id).toEqual("2");
				expect(shareContributor?.archive.thumbUrl200).toEqual(
					"https://test-archive-thumbnail",
				);
				expect(shareContributor?.archive.name).toEqual("Test Archive");
			}
		}
	});

	test("should return folder contents in alphabetical ascending order", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Private Folder");
		expect(children[1]?.displayName).toEqual("Public File");
	});

	test("should return folder contents in alphabetical descending order", async () => {
		await db.query(
			"UPDATE folder SET sort = 'sort.alphabetical_desc' WHERE folderid = 10",
		);
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Public File");
		expect(children[1]?.displayName).toEqual("Private Folder");
	});

	test("should return folder contents in alphabetical ascending order by date", async () => {
		await db.query(
			"UPDATE folder SET sort = 'sort.display_date_asc' WHERE folderid = 10",
		);
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Public File");
		expect(children[1]?.displayName).toEqual("Private Folder");
	});

	test("should return folder contents in alphabetical descending order by date", async () => {
		await db.query(
			"UPDATE folder SET sort = 'sort.display_date_desc' WHERE folderid = 10",
		);
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Private Folder");
		expect(children[1]?.displayName).toEqual("Public File");
	});

	test("should return folder contents in alphabetical ascending order by type", async () => {
		await db.query(
			"UPDATE folder SET sort = 'sort.type_asc' WHERE folderid = 10",
		);
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Private Folder");
		expect(children[1]?.displayName).toEqual("Public File");
	});

	test("should return folder contents in alphabetical descending order by type", async () => {
		await db.query(
			"UPDATE folder SET sort = 'sort.type_desc' WHERE folderid = 10",
		);
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(2);
		expect(children[0]?.displayName).toEqual("Public File");
		expect(children[1]?.displayName).toEqual("Private Folder");
	});

	test("should return an empty list if the caller doesn't have access to the folder", async () => {
		mockExtractUserEmailFromAuthToken("test+5@permanent.org");
		const response = await agent
			.get("/api/v2/folder/2/children?pageSize=100")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(0);
	});

	test("should return no more than pageSize items", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=1")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(1);
	});

	test("should only return items past the cursor", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=1&cursor=1")
			.expect(200);
		const {
			body: { items: children },
		} = response as { body: { items: (ArchiveRecord | Folder)[] } };
		expect(children.length).toEqual(1);
		expect(children[0]?.displayName).toEqual("Public File");
	});

	test("should include pagination data in response", async () => {
		const response = await agent
			.get("/api/v2/folder/10/children?pageSize=1")
			.expect(200);
		const {
			body: { pagination: paginationData },
		} = response as {
			body: {
				pagination: {
					nextCursor: string;
					nextPage: string;
					totalPages: number;
				};
			};
		};
		expect(paginationData.nextCursor).toEqual("1");
		expect(paginationData.nextPage).toEqual(
			`https://${
				process.env["SITE_URL"] ?? ""
			}/api/v2/folder/10/children?pageSize=1&cursor=1`,
		);
		expect(paginationData.totalPages).toEqual(2);
	});

	test("should return 500 if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValue(new Error("test error"));
		await agent.get("/api/v2/folder/10/children?pageSize=1").expect(500);
	});
});
