import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { v4 as uuidv4 } from "uuid";
import { when } from "jest-when";
import { app } from "../app";
import {
	extractUserEmailFromAuthToken,
	verifyUserAuthentication,
} from "../middleware";
import { db } from "../database";
import type { ShareLink } from "./models";
import {
	mockVerifyUserAuthentication,
	mockExtractUserEmailFromAuthToken,
} from "../../test/middleware_mocks";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("uuid");

const loadFixtures = async (): Promise<void> => {
	await db.sql("share_link.fixtures.create_test_accounts");
	await db.sql("share_link.fixtures.create_test_archives");
	await db.sql("share_link.fixtures.create_test_account_archives");
	await db.sql("share_link.fixtures.create_test_records");
	await db.sql("share_link.fixtures.create_test_folders");
	await db.sql("share_link.fixtures.create_test_folder_links");
	await db.sql("share_link.fixtures.create_test_shareby_urls");
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, record, folder, folder_link, shareby_url CASCADE",
	);
};

interface ShareLinkRow {
	status: string;
	urltoken: string;
	shareurl: string;
	maxuses: string;
	uses: string;
	unrestricted: boolean;
	autoapprovetoggle: boolean;
	defaultaccessrole: string;
	expiresdt: string;
	byaccountid: string;
	byarchiveid: string;
}

const retrieveShareLink = async (
	folderLinkId: string,
): Promise<ShareLinkRow | undefined> => {
	const shareLinkResult = await db.query<ShareLinkRow>(
		`SELECT
        status,
        urltoken,
        shareurl,
        maxuses,
        uses,
        unrestricted,
        autoapprovetoggle,
        defaultaccessrole,
        expiresdt,
        byaccountid,
        byarchiveid
      FROM
        shareby_url
      WHERE
        folder_linkId = :folderLinkId`,
		{ folderLinkId },
	);

	return shareLinkResult.rows[0];
};

describe("POST /share-links", () => {
	const agent = request(app);
	const testUuid = "3afb2671-bc26-4928-9ea9-0ad4cb735f11";

	beforeEach(async () => {
		jest.mocked(uuidv4).mockImplementation(jest.fn().mockReturnValue(testUuid));
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"315aedc2-67d5-4144-9f0d-ee547d98af9c",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should return 201 for a valid request", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
			})
			.expect(201);
	});

	test("should accept a folder", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "1",
				itemType: "folder",
			})
			.expect(201);
	});

	test("should return 401 if the caller is not authenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			});
		await agent.post("/api/v2/share-links").expect(401);
	});

	test("should return 400 if the request fails validation", async () => {
		await agent.post("/api/v2/share-links").expect(400);
	});

	test("should return a 400 error if the request attempts to create an unlisted link for a public item", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "5",
				itemType: "record",
				accessRestrictions: "none",
			})
			.expect(400);
	});

	test("should create a shareby_url record", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
			})
			.expect(201);

		const shareLink = await retrieveShareLink("1");
		expect(shareLink).toBeDefined();
		if (shareLink !== undefined) {
			expect(shareLink.status).toEqual("status.generic.ok");
			expect(shareLink.shareurl).toEqual(
				`https://${process.env["SITE_URL"] ?? ""}/share/${shareLink.urltoken}`,
			);
			expect(shareLink.maxuses).toEqual("0");
			expect(shareLink.uses).toBeNull();
			expect(shareLink.unrestricted).toEqual(true);
			expect(shareLink.autoapprovetoggle).toEqual(1);
			expect(shareLink.defaultaccessrole).toEqual("access.role.viewer");
			expect(shareLink.expiresdt).toBeNull();
			expect(shareLink.byaccountid).toEqual("2");
			expect(shareLink.byarchiveid).toEqual("1");
		}
	});

	test("should correctly record optional fields in the database", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
				permissionsLevel: "editor",
				accessRestrictions: "approval",
				maxUses: 5,
				expirationTimestamp: "2022-01-01T00:00:00.000Z",
			})
			.expect(201);

		const shareLink = await retrieveShareLink("1");
		expect(shareLink?.maxuses).toEqual("5");
		expect(shareLink?.unrestricted).toEqual(false);
		expect(shareLink?.autoapprovetoggle).toEqual(0);
		expect(shareLink?.defaultaccessrole).toEqual("access.role.editor");
		expect(shareLink?.expiresdt).toEqual(new Date("2022-01-01T00:00:00.000Z"));
	});

	test("should correctly record unrestricted and autoapproval toggle for 'account' restriction", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
				accessRestrictions: "account",
			})
			.expect(201);

		const shareLink = await retrieveShareLink("1");
		expect(shareLink?.unrestricted).toEqual(false);
		expect(shareLink?.autoapprovetoggle).toEqual(1);
	});

	test("should return the created share link object", async () => {
		const response = await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
			})
			.expect(201);

		const {
			body: { data: shareLink },
		} = response as { body: { data: ShareLink } };
		expect(shareLink.id).toBeDefined();
		expect(shareLink.itemId).toEqual("2");
		expect(shareLink.itemType).toEqual("record");
		expect(shareLink.token).toBeDefined();
		expect(shareLink.permissionsLevel).toEqual("viewer");
		expect(shareLink.accessRestrictions).toEqual("none");
		expect(shareLink.maxUses).toBeNull();
		expect(shareLink.usesExpended).toBeNull();
		expect(shareLink.expirationTimestamp).toBeNull();
		expect(shareLink.creatorAccount.id).toBe("2");
		expect(shareLink.creatorAccount.name).toBe("Jack Rando");
		expect(shareLink.createdAt).toBeDefined();
		expect(shareLink.updatedAt).toBeDefined();
	});

	test("should return maxUses as a number if set", async () => {
		const response = await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
				accessRestrictions: "account",
				maxUses: 5,
			})
			.expect(201);

		const {
			body: { data: shareLink },
		} = response as { body: { data: ShareLink } };
		expect(shareLink.maxUses).toEqual(5);
	});

	test("should default accessRestrictions to 'account' if item is public", async () => {
		const response = await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "5",
				itemType: "record",
			})
			.expect(201);

		const {
			body: { data: shareLink },
		} = response as { body: { data: ShareLink } };
		expect(shareLink.accessRestrictions).toEqual("account");
	});

	test("should return a 500 error if the database call fails", async () => {
		const testError = new Error("Test error");
		const dbSpy = jest.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("share_link.queries.create_share_link", {
				itemId: "2",
				itemType: "record",
				permissionsLevel: "access.role.viewer",
				unlisted: true,
				noApproval: 1,
				maxUses: 0,
				expirationTimestamp: undefined,
				urlToken: testUuid,
				shareUrl: `https://${process.env["SITE_URL"] ?? ""}/share/${testUuid}`,
				email: "test@permanent.org",
			})
			.mockRejectedValue(testError);
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
			})
			.expect(500);
	});

	test("should return a 404 error if the database returns an empty result", async () => {
		const dbSpy = jest.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("share_link.queries.create_share_link", {
				itemId: "2",
				itemType: "record",
				permissionsLevel: "access.role.viewer",
				unlisted: true,
				noApproval: 1,
				maxUses: 0,
				expirationTimestamp: undefined,
				urlToken: testUuid,
				shareUrl: `https://${process.env["SITE_URL"] ?? ""}/share/${testUuid}`,
				email: "test@permanent.org",
			})
			.mockImplementation(jest.fn().mockResolvedValue({ rows: [] }));
		await agent
			.post("/api/v2/share-links")
			.send({
				itemId: "2",
				itemType: "record",
			})
			.expect(404);
	});

	test("should return 404 if the item to be shared doesn't exist", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({ itemId: "1000000", itemType: "record" })
			.expect(404);
	});

	test("should return 404 if the caller has no access to item to be shared", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({ itemId: "3", itemType: "record" })
			.expect(404);
	});

	test("should return 403 if the caller has insufficient access to item to be shared", async () => {
		await agent
			.post("/api/v2/share-links")
			.send({ itemId: "4", itemType: "record" })
			.expect(403);
	});
});

describe("PATCH /share-links/{id}", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"315aedc2-67d5-4144-9f0d-ee547d98af9c",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		await clearDatabase();
	});

	test("should return 200 for a valid request", async () => {
		await agent
			.patch("/api/v2/share-links/1000")
			.send({ expirationTimestamp: "2032-10-10" })
			.expect(200);
	});

	test("should return 401 if the caller is unauthenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (_, __, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			});
		await agent.patch("/api/v2/share-links/1").send({}).expect(401);
	});

	test("should return 404 the caller is not the creator of the share link", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"315aedc2-67d5-4144-9f0d-ee547d98af9c",
		);
		await agent
			.patch("/api/v2/share-links/1000")
			.send({ permissionsLevel: "viewer" })
			.expect(404);
	});

	test("should return 400 if the request is invalid", async () => {
		await agent
			.patch("/api/v2/share-links/1")
			.send({ maxUses: -1 })
			.expect(400);
	});

	test("should return 400 if the request attempts to set maxUses on an unlisted link", async () => {
		await agent
			.patch("/api/v2/share-links/1000")
			.send({ maxUses: 100 })
			.expect(400);
	});

	test("should return 400 if the request attempts to set permissionsLevel above 'viewer' on an unlisted link", async () => {
		await agent
			.patch("/api/v2/share-links/1000")
			.send({ permissionsLevel: "owner" })
			.expect(400);
	});

	test("should return 400 if the request attempts to set a link with maxUses set to be unlisted", async () => {
		await agent
			.patch("/api/v2/share-links/1001")
			.send({ accessRestrictions: "none" })
			.expect(400);
	});

	test("should return 400 if the request attempts to set a link where permissionsLevel != 'viewer to be unlisted", async () => {
		await agent
			.patch("/api/v2/share-links/1002")
			.send({ accessRestrictions: "none" })
			.expect(400);
	});

	test("should allow maxUses and permissionsLevel != 'viewer' if updating accessRestrictions to something other than 'none'", async () => {
		await agent
			.patch("/api/v2/share-links/1000")
			.send({
				permissionsLevel: "owner",
				maxUses: 100,
				accessRestrictions: "account",
			})
			.expect(200);
	});

	test("should update provided fields", async () => {
		await agent
			.patch("/api/v2/share-links/1000")
			.send({
				accessRestrictions: "account",
				permissionsLevel: "editor",
				maxUses: 500,
				expirationTimestamp: "2052-01-01T00:00:00.000Z",
			})
			.expect(200);

		const shareLink = await retrieveShareLink("5");
		expect(shareLink?.maxuses).toEqual("500");
		expect(shareLink?.unrestricted).toEqual(false);
		expect(shareLink?.autoapprovetoggle).toEqual(1);
		expect(shareLink?.defaultaccessrole).toEqual("access.role.editor");
		expect(shareLink?.expiresdt).toEqual(new Date("2052-01-01T00:00:00.000Z"));
	});

	test("should return the updated share link", async () => {
		const response = await agent
			.patch("/api/v2/share-links/1000")
			.send({
				accessRestrictions: "account",
				permissionsLevel: "editor",
				maxUses: 500,
				expirationTimestamp: "2052-01-01T00:00:00.000Z",
			})
			.expect(200);

		const {
			body: { data: shareLink },
		} = response as { body: { data: ShareLink } };
		expect(shareLink).toEqual({
			id: expect.any(String) as unknown,
			itemId: "6",
			itemType: "record",
			token: expect.any(String) as unknown,
			permissionsLevel: "editor",
			accessRestrictions: "account",
			maxUses: 500,
			usesExpended: null,
			expirationTimestamp: expect.any(String) as unknown,
			creatorAccount: { id: "2", name: "Jack Rando" },
			createdAt: expect.any(String) as unknown,
			updatedAt: expect.any(String) as unknown,
		});
	});

	test("should update nullable fields to null if request sets them to explicit null", async () => {
		await agent
			.patch("/api/v2/share-links/1001")
			.send({
				maxUses: null,
				expirationTimestamp: null,
			})
			.expect(200);

		const shareLink = await retrieveShareLink("6");
		expect(shareLink?.maxuses).toBeNull();
		expect(shareLink?.expiresdt).toBeNull();
	});

	test("should not update fields if they aren't set in the request", async () => {
		await agent
			.patch("/api/v2/share-links/1001")
			.send({
				permissionsLevel: "editor",
			})
			.expect(200);

		const shareLink = await retrieveShareLink("6");
		expect(shareLink?.maxuses).not.toBeNull();
		expect(shareLink?.expiresdt).not.toBeNull();
		expect(shareLink?.defaultaccessrole).toEqual("access.role.editor");
		expect(shareLink?.unrestricted).toEqual(false);
		expect(shareLink?.autoapprovetoggle).toEqual(0);
	});

	test("should return 400 if the request is empty", async () => {
		await agent.patch("/api/v2/share-links/1001").send().expect(400);
	});

	test("should return 400 is not parseable json", async () => {
		await agent
			.patch("/api/v2/share-links/1001")
			.send("{'this_object': 'is_missing_a_closing_brace'")
			.expect(400);
	});

	test("should return the updated share link", async () => {
		const response = await agent
			.patch("/api/v2/share-links/1000")
			.send({
				accessRestrictions: "account",
				permissionsLevel: "editor",
				maxUses: 500,
				expirationTimestamp: "2052-01-01T00:00:00.000Z",
			})
			.expect(200);

		const {
			body: { data: shareLink },
		} = response as { body: { data: ShareLink } };
		expect(shareLink.accessRestrictions).toEqual("account");
		expect(shareLink.permissionsLevel).toEqual("editor");
		expect(shareLink.maxUses).toEqual(500);
		expect(shareLink.expirationTimestamp).toEqual("2052-01-01T00:00:00.000Z");
	});

	test("should return 500 if the query to retrieve the share link fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		await agent
			.patch("/api/v2/share-links/1000")
			.send({
				accessRestrictions: "account",
				permissionsLevel: "editor",
				maxUses: 500,
				expirationTimestamp: "2052-01-01T00:00:00.000Z",
			})
			.expect(500);
	});

	test("should return 500 if the query to update the share link fails", async () => {
		const dbSpy = jest.spyOn(db, "sql");
		when(dbSpy)
			.calledWith("share_link.queries.update_share_link", {
				permissionsLevel: "access.role.editor",
				unlisted: false,
				noApproval: 1,
				maxUses: 500,
				setMaxUsesToNull: false,
				expirationTimestamp: undefined,
				setExpirationTimestampToNull: false,
				shareLinkId: "1000",
				email: "test@permanent.org",
			})
			.mockRejectedValue(new Error("Test error"));
		await agent
			.patch("/api/v2/share-links/1000")
			.send({
				accessRestrictions: "account",
				permissionsLevel: "editor",
				maxUses: 500,
			})
			.expect(500);
	});
});

describe("GET /share-links", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockExtractUserEmailFromAuthToken("test@permanent.org");
		await loadFixtures();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		await clearDatabase();
	});

	test("should return 200 for a valid request", async () => {
		await agent.get("/api/v2/share-links?shareLinkIds[]=1").expect(200);
	});

	test("should return 401 if the caller's auth token is invalid", async () => {
		jest
			.mocked(extractUserEmailFromAuthToken)
			.mockImplementation(
				async (
					_: Request<unknown, unknown, { emailFromAuthToken?: string }>,
					__: Response,
					next: NextFunction,
				) => {
					next(new createError.Unauthorized("Invalid token"));
				},
			);
		await agent.get("/api/v2/share-links?shareLinkIds[]=1").expect(401);
	});

	test("should return 400 if the header values are invalid", async () => {
		mockExtractUserEmailFromAuthToken("not_an_email");
		await agent.get("/api/v2/share-links?shareLinkIds[]=1").expect(400);
	});

	test("should return an empty list if caller asks for share links they can't access", async () => {
		mockExtractUserEmailFromAuthToken("test+1@permanent.org");
		const response = await agent
			.get("/api/v2/share-links?shareLinkIds[]=1000")
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("should return multiple share links if requested", async () => {
		const response = await agent
			.get("/api/v2/share-links?shareLinkIds[]=1000&shareLinkIds[]=1001")
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(2);
	});

	test("should return share links requested by their tokens", async () => {
		const response = await agent
			.get(
				"/api/v2/share-links?shareTokens[]=e969f9dc-42b5-45c0-a496-1dcff2ca11f5&shareTokens[]=0fcb840f-d22c-4a51-a358-2a61677e8fb2",
			)
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(2);
	});

	test("should respond with an empty list if the share link doesn't exist", async () => {
		const response = await agent
			.get(
				"/api/v2/share-links?shareLinkIds[]=e969f9dc-42b5-45c0-a496-1dcff2ca11f5",
			)
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("should return share links requested by their tokens without a JWT", async () => {
		mockVerifyUserAuthentication();
		const response = await agent
			.get(
				"/api/v2/share-links?shareTokens[]=e969f9dc-42b5-45c0-a496-1dcff2ca11f5&shareTokens[]=0fcb840f-d22c-4a51-a358-2a61677e8fb2",
			)
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(2);
	});

	test("should not return share links requested by their ids without a JWT", async () => {
		mockExtractUserEmailFromAuthToken();
		await agent
			.get("/api/v2/share-links?shareLinkIds[]=1000&shareLinkIds[]=1001")
			.expect(401);
	});

	test("should include all expected fields in response", async () => {
		const response = await agent
			.get("/api/v2/share-links?shareLinkIds[]=1000")
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(1);
		expect(shareLinks[0]).toEqual({
			id: "1000",
			itemId: "6",
			itemType: "record",
			token: "e969f9dc-42b5-45c0-a496-1dcff2ca11f5",
			permissionsLevel: "viewer",
			accessRestrictions: "none",
			maxUses: null,
			usesExpended: null,
			expirationTimestamp: null,
			creatorAccount: { id: "2", name: "Jack Rando" },
			createdAt: expect.any(String) as unknown,
			updatedAt: expect.any(String) as unknown,
		});
	});

	test("should return a 500 error if the database call fails", async () => {
		jest
			.spyOn(db, "sql")
			.mockRejectedValue(new Error("out of cheese - redo from start"));
		await agent.get("/api/v2/share-links?shareLinkIds[]=1000").expect(500);
	});
});

describe("DELETE /share-links", () => {
	const agent = request(app);

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"ceca5477-3f9c-4d0a-a7b8-04d5e5adac32",
		);
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	test("should return 204 for a valid request", async () => {
		await agent.delete("/api/v2/share-links/1000").expect(204);
	});

	test("should return 401 if the caller is unauthenticated", async () => {
		jest
			.mocked(verifyUserAuthentication)
			.mockImplementation(async (__, _, next: NextFunction) => {
				next(new createError.Unauthorized("Invalid token"));
			});
		await agent.delete("/api/v2/share-links/1000").expect(401);
	});

	test("should return 400 if header values are missing", async () => {
		mockVerifyUserAuthentication();
		await agent.delete("/api/v2/share-links/1000").expect(400);
	});

	test("should delete the share link", async () => {
		await agent.delete("/api/v2/share-links/1000").expect(204);
		const response = await agent
			.get("/api/v2/share-links?shareLinkIds[]=1000")
			.expect(200);
		const {
			body: { items: shareLinks },
		} = response as { body: { items: ShareLink[] } };
		expect(shareLinks.length).toEqual(0);
	});

	test("should return 404 if the share link doesn't exist", async () => {
		await agent.delete("/api/v2/share-links/1000").expect(204);
		await agent.delete("/api/v2/share-links/1000").expect(404);
	});

	test("should return 404 if the caller doesn't have access to the share link", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"ceca5477-3f9c-4d0a-a7b8-04d5e5adac32",
		);
		await agent.delete("/api/v2/share-links/1000").expect(404);
	});

	test("should return 500 if the database call fails", async () => {
		jest.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		await agent.delete("/api/v2/share-links/1000").expect(500);
	});
});
