import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import { logger } from "@stela/logger";
import { app } from "../../app.js";
import { db } from "../../database.js";
import { runFixtures } from "../../../test/run_fixtures.js";
import type { SearchPublicArchivesResponse } from "../models.js";

vi.mock("../../database");
vi.mock("@stela/logger");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"archive.fixtures.create_test_accounts",
		"archive.fixtures.create_test_public_search_archives",
		"archive.fixtures.create_test_public_search_profile_items",
		"archive.fixtures.create_test_public_search_folders",
		"archive.fixtures.create_test_public_search_records",
		"archive.fixtures.create_test_public_search_bulk_records",
		"archive.fixtures.create_test_public_search_tags",
		"archive.fixtures.create_test_public_search_tag_links",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, profile_item, folder, record, tag, tag_link CASCADE",
	);
};

const searchPath = "/api/v2/archives/public/search";

const search = async (
	query: Record<string, string>,
	expectedStatus = 200,
): Promise<SearchPublicArchivesResponse> => {
	const response = await request(app)
		.get(searchPath)
		.query(query)
		.expect(expectedStatus);
	return response.body as SearchPublicArchivesResponse;
};

const archiveIds = (response: SearchPublicArchivesResponse): string[] =>
	response.items.map((result) => result.archive.id);

const nullItemThumbnails = {
	width200: null,
	width256: null,
	width500: null,
	width1000: null,
	width2000: null,
};

describe("GET /archives/public/search", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should return public archives with their public matches", async () => {
		const { items, pagination } = await search({
			query: "harriet",
			pageSize: "10",
		});

		expect(items).toEqual([
			{
				archive: {
					id: "101",
					name: "Harriet Tubman Collection",
					thumbnailUrls: {
						width200: "https://test-archive-thumbnail-101",
						width500: null,
						width1000: null,
						width2000: null,
					},
				},
				totalMatchCount: 3,
				matches: [
					{ matchType: "archiveName" },
					{
						matchType: "item",
						matchedFields: ["description"],
						item: {
							id: "402",
							itemType: "record",
							displayName: "Letter",
							displayTime: null,
							thumbnailUrls: nullItemThumbnails,
						},
					},
					{
						matchType: "item",
						matchedFields: ["name"],
						item: {
							id: "401",
							itemType: "record",
							displayName: "Portrait of Harriet",
							displayTime: null,
							thumbnailUrls: nullItemThumbnails,
						},
					},
				],
			},
			{
				archive: {
					id: "102",
					name: "Riverside Historical Society",
					thumbnailUrls: {
						width200: null,
						width500: null,
						width1000: null,
						width2000: null,
					},
				},
				totalMatchCount: 2,
				matches: [
					{
						matchType: "milestone",
						matchedFields: ["title"],
						milestone: {
							id: "201",
							title: "Founded by Harriet Jones",
							description: "The society began meeting",
							date: "1901-05-01",
						},
					},
					{
						matchType: "item",
						matchedFields: ["tagName"],
						item: {
							id: "404",
							itemType: "record",
							displayName: "Meeting Minutes",
							displayTime: null,
							thumbnailUrls: nullItemThumbnails,
						},
						matchedTags: [
							{
								id: "501",
								name: "Harriet",
								type: "type.generic.placeholder",
							},
						],
					},
				],
			},
		]);
		expect(pagination.totalPages).toEqual(1);
	});

	test("should never return private archives or private, future, or deleted content", async () => {
		const response = await search({ query: "harriet", pageSize: "10" });
		const serialized = JSON.stringify(response.items);

		expect(archiveIds(response)).toEqual(["101", "102"]);
		[
			"Harriet Private Papers",
			"Harriet Deleted Archive",
			"Harriet Letters",
			"Harriet Drafts",
			"Harriet Future Folder",
			"Harriet Deleted Folder",
			"Harriet private record",
			"Budget",
			"Harriet private milestone",
			"Harriet future milestone",
			"Harriet deleted milestone",
			"Harriet deleted tag",
			"Harriet deleted link",
		].forEach((privateName) => {
			expect(serialized).not.toContain(privateName);
		});
	});

	test("should match word prefixes in any order", async () => {
		const response = await search({ query: "tub harr", pageSize: "10" });

		expect(archiveIds(response)).toEqual(["101"]);
		expect(response.items[0]?.matches).toEqual([{ matchType: "archiveName" }]);
	});

	test("should match folder names", async () => {
		const { items } = await search({
			query: "railroad underground",
			pageSize: "10",
		});

		expect(items[0]?.matches).toEqual([
			{
				matchType: "item",
				matchedFields: ["name"],
				item: {
					id: "301",
					itemType: "folder",
					displayName: "Underground Railroad Maps",
					displayTime: null,
					thumbnailUrls: nullItemThumbnails,
				},
			},
		]);
	});

	test("should match milestone descriptions", async () => {
		const { items } = await search({ query: "araminta", pageSize: "10" });

		expect(items[0]?.matches).toEqual([
			{
				matchType: "milestone",
				matchedFields: ["description"],
				milestone: {
					id: "205",
					title: "Early life",
					description: "Born Araminta Ross",
					date: "1822-03-01",
				},
			},
		]);
	});

	test("should match custom metadata tag field names and values", async () => {
		const byType = await search({ query: "birthplace", pageSize: "10" });
		const byName = await search({ query: "cambridge", pageSize: "10" });
		const tag = {
			id: "502",
			name: "Cambridge",
			type: "type.tag.metadata.birthplace",
		};

		expect(byType.items[0]?.matches).toEqual([
			expect.objectContaining({
				matchType: "item",
				matchedFields: ["tagType"],
				matchedTags: [tag],
			}),
		]);
		expect(byName.items[0]?.matches).toEqual([
			expect.objectContaining({
				matchType: "item",
				matchedFields: ["tagName"],
				matchedTags: [tag],
			}),
		]);
	});

	test("should not match generic tag types or the custom metadata prefix", async () => {
		const genericType = await search({ query: "placeholder", pageSize: "10" });
		const byPrefix = await search({ query: "metadata", pageSize: "10" });

		expect(genericType.items).toEqual([]);
		expect(byPrefix.items).toEqual([]);
	});

	test("should not match root folders", async () => {
		const { items } = await search({ query: "public", pageSize: "10" });

		expect(items).toEqual([]);
	});

	test("should cap matches per archive while counting all of them", async () => {
		const { items } = await search({ query: "page", pageSize: "10" });

		expect(items.length).toEqual(1);
		expect(items[0]?.totalMatchCount).toEqual(12);
		expect(items[0]?.matches.length).toEqual(10);
	});

	test("should page through archives with a cursor", async () => {
		const firstPage = await search({ query: "harriet", pageSize: "1" });
		expect(archiveIds(firstPage)).toEqual(["101"]);
		expect(firstPage.pagination.nextCursor).toEqual("101");
		expect(firstPage.pagination.nextPage).toContain(
			"/api/v2/archives/public/search?query=harriet&pageSize=1&cursor=101",
		);
		expect(firstPage.pagination.totalPages).toEqual(2);

		const secondPage = await search({
			query: "harriet",
			pageSize: "1",
			cursor: "101",
		});
		expect(archiveIds(secondPage)).toEqual(["102"]);

		const lastPage = await search({
			query: "harriet",
			pageSize: "1",
			cursor: "102",
		});
		expect(lastPage.items).toEqual([]);
		expect(lastPage.pagination.nextCursor).toBeUndefined();
	});

	test("should return an empty page for an unknown cursor", async () => {
		const { items } = await search({
			query: "harriet",
			pageSize: "10",
			cursor: "999999",
		});

		expect(items).toEqual([]);
	});

	test("should ignore search operators and punctuation in the query", async () => {
		const plain = await search({ query: "harriet", pageSize: "10" });
		const withOperators = await search({
			query: "harriet & | ! :* ( )",
			pageSize: "10",
		});

		expect(withOperators.items).toEqual(plain.items);
	});

	test("should return no results for a query without words", async () => {
		const { items } = await search({ query: "!!&&|", pageSize: "10" });

		expect(items).toEqual([]);
	});

	test("should not fail on quotes or backslashes in the query", async () => {
		const { items } = await search({ query: "o'brien\\", pageSize: "10" });

		expect(items).toEqual([]);
	});

	test("should ignore authentication headers", async () => {
		const anonymous = await search({ query: "harriet", pageSize: "10" });
		const response = await request(app)
			.get(searchPath)
			.query({ query: "harriet", pageSize: "10" })
			.set("Authorization", "Bearer not-a-real-token")
			.set("X-Permanent-Share-Token", "not-a-real-share-token")
			.expect(200);

		expect(response.body).toEqual(anonymous);
	});

	test.each([
		["query is missing", { pageSize: "10" }],
		["query is too short", { query: "ab", pageSize: "10" }],
		["trimmed query is too short", { query: "  ab  ", pageSize: "10" }],
		["query is too long", { query: "a".repeat(101), pageSize: "10" }],
		["pageSize is missing", { query: "harriet" }],
		["pageSize is zero", { query: "harriet", pageSize: "0" }],
		["pageSize is too large", { query: "harriet", pageSize: "51" }],
		["pageSize is not an integer", { query: "harriet", pageSize: "1.5" }],
		[
			"cursor is not numeric",
			{ query: "harriet", pageSize: "10", cursor: "abc" },
		],
		[
			"cursor is too long",
			{ query: "harriet", pageSize: "10", cursor: "1".repeat(19) },
		],
		[
			"an unknown parameter is sent",
			{ query: "harriet", pageSize: "10", archiveId: "103" },
		],
	])("should return 400 when %s", async (_, query) => {
		await search(query, 400);
	});

	test("should return 400 when query is repeated", async () => {
		await request(app)
			.get(`${searchPath}?query=harriet&query=tubman&pageSize=10`)
			.expect(400);
	});

	test("should return 500 and log the error if the query fails", async () => {
		const testError = new Error("out of cheese - redo from start");
		vi.spyOn(db, "sql").mockRejectedValueOnce(testError);

		await request(app)
			.get(searchPath)
			.query({ query: "harriet", pageSize: "10" })
			.expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});
});
