import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { app } from "../../app";
import { db } from "../../database";
import {
	extractShareTokenFromHeaders,
	extractUserEmailFromAuthToken,
} from "../../middleware";
import type { GetFoldersResponse } from "../models";
import {
	mockExtractUserEmailFromAuthToken,
	mockExtractShareTokenFromHeaders,
} from "../../../test/middleware_mocks";
import { loadFixtures, clearDatabase } from "./utils_test";

vi.mock("../../database");
vi.mock("../../middleware");
vi.mock("@stela/logger");

const testEmail = "test@permanent.org";
describe("GET /folders", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockExtractUserEmailFromAuthToken(testEmail);
		mockExtractShareTokenFromHeaders();

		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	test("expect a missing pageSize to cause a 400 error", async () => {
		await agent.get("/api/v2/folders?folderIds[]=1").expect(400);
	});

	test("expect a missing folderIds to cause a 400 error", async () => {
		await agent.get("/api/v2/folders?pageSize=100").expect(400);
	});

	test("should return 200 code for successful call", async () => {
		await agent.get("/api/v2/folders?folderIds[]=1&pageSize=100").expect(200);
	});

	test("should call extractUserEmailFromAuthToken middleware", async () => {
		await agent.get("/api/v2/folders?folderIds[]=1&pageSize=100").expect(200);
		expect(extractUserEmailFromAuthToken).toHaveBeenCalled();
	});

	test("should call extractShareTokenFromHeaders middleware", async () => {
		await agent.get("/api/v2/folders?folderIds[]=1&pageSize=100").expect(200);
		expect(extractShareTokenFromHeaders).toHaveBeenCalled();
	});

	test("expect a response with an items array and pagination metadata", async () => {
		const response = await agent
			.get("/api/v2/folders?folderIds[]=1&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.folderId).toEqual("1");
		expect(body.pagination).toBeDefined();
	});

	test("expect no more than pageSize items to be returned", async () => {
		const response = await agent
			.get(
				"/api/v2/folders?folderIds[]=1&folderIds[]=2&folderIds[]=12&pageSize=2",
			)
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(2);
	});

	test("expect to page through all matching folders via cursor, in ascending folderId order", async () => {
		const firstResponse = await agent
			.get(
				"/api/v2/folders?folderIds[]=1&folderIds[]=2&folderIds[]=12&folderIds[]=13&folderIds[]=100&pageSize=2",
			)
			.expect(200);
		const { body: firstPage } = firstResponse as { body: GetFoldersResponse };
		expect(firstPage.items.map((folder) => folder.folderId)).toEqual([
			"1",
			"2",
		]);
		expect(firstPage.pagination.totalPages).toEqual(3);
		expect(firstPage.pagination.nextCursor).toBeDefined();

		const secondResponse = await agent
			.get(
				`/api/v2/folders?folderIds[]=1&folderIds[]=2&folderIds[]=12&folderIds[]=13&folderIds[]=100&pageSize=2&cursor=${firstPage.pagination.nextCursor}`,
			)
			.expect(200);
		const { body: secondPage } = secondResponse as {
			body: GetFoldersResponse;
		};
		expect(secondPage.items.map((folder) => folder.folderId)).toEqual([
			"12",
			"13",
		]);
		expect(secondPage.pagination.totalPages).toEqual(3);

		const thirdResponse = await agent
			.get(
				`/api/v2/folders?folderIds[]=1&folderIds[]=2&folderIds[]=12&folderIds[]=13&folderIds[]=100&pageSize=2&cursor=${secondPage.pagination.nextCursor}`,
			)
			.expect(200);
		const { body: thirdPage } = thirdResponse as { body: GetFoldersResponse };
		expect(thirdPage.items.map((folder) => folder.folderId)).toEqual(["100"]);
		expect(thirdPage.pagination.totalPages).toEqual(3);
	});

	test("expect pagination.nextPage to link to the next page with the same filters", async () => {
		const response = await agent
			.get(
				"/api/v2/folders?folderIds[]=1&folderIds[]=2&folderIds[]=12&pageSize=2",
			)
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.pagination.nextPage).toEqual(
			`https://${process.env["SITE_URL"] ?? ""}/api/v2/folders?folderIds%5B%5D=1&folderIds%5B%5D=2&folderIds%5B%5D=12&pageSize=2&cursor=${
				body.pagination.nextCursor ?? ""
			}`,
		);
	});

	test("expect no items when querying with a cursor past the last item", async () => {
		const response = await agent
			.get("/api/v2/folders?folderIds[]=1&folderIds[]=2&pageSize=100")
			.expect(200);
		const {
			body,
			body: {
				pagination: { nextCursor },
			},
		} = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(2);
		expect(nextCursor).toBeDefined();

		const nextResponse = await agent
			.get(
				`/api/v2/folders?folderIds[]=1&folderIds[]=2&pageSize=100&cursor=${nextCursor}`,
			)
			.expect(200);
		const { body: nextBody } = nextResponse as { body: GetFoldersResponse };
		expect(nextBody.items).toHaveLength(0);
	});

	test("should return a public folder if the user is not authenticated", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/folders?folderIds[]=1&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.folderId).toEqual("1");
	});

	test("should not return a private folder if the user is not authenticated", async () => {
		mockExtractUserEmailFromAuthToken();
		const response = await agent
			.get("/api/v2/folders?folderIds[]=2&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(0);
	});

	test("should return a private folder if the user has a share token", async () => {
		mockExtractUserEmailFromAuthToken();
		mockExtractShareTokenFromHeaders("c0f523e4-48d8-4c39-8cda-5e95161532e4");
		const response = await agent
			.get("/api/v2/folders?folderIds[]=2&pageSize=100")
			.set("X-Permanent-Share-Token", "c0f523e4-48d8-4c39-8cda-5e95161532e4")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(1);
		expect(body.items[0]?.folderId).toEqual("2");
	});

	test("should not retrieve a deleted folder", async () => {
		const response = await agent
			.get("/api/v2/folders?folderIds[]=4&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(0);
	});

	test("should not retrieve a folder with a deleted folder_link", async () => {
		const response = await agent
			.get("/api/v2/folders?folderIds[]=3&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(0);
	});

	test("should retrieve multiple folders if requested", async () => {
		const response = await agent
			.get("/api/v2/folders?folderIds[]=2&folderIds[]=1&pageSize=100")
			.expect(200);
		const { body } = response as { body: GetFoldersResponse };
		expect(body.items).toHaveLength(2);
	});

	test("should throw a 500 error if database call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("test error"));
		await agent.get("/api/v2/folders?folderIds[]=2&pageSize=100").expect(500);
	});
});
