import type { NextFunction, Request } from "express";
import request from "supertest";
import { logger } from "@stela/logger";
import createError from "http-errors";
import { app } from "../../app";
import { db } from "../../database";
import { verifyUserAuthentication } from "../../middleware";
import type { ShareLink } from "../../share_link/models";
import { loadFixtures, clearDatabase } from "./utils_test";

jest.mock("../../database");
jest.mock("../../middleware");
jest.mock("@stela/logger");

describe("GET /folder/{id}/share_links", () => {
	const agent = request(app);

	beforeEach(async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body.emailFromAuthToken = "test@permanent.org";
				req.body.userSubjectFromAuthToken =
					"b5461dc2-1eb0-450e-b710-fef7b2cafe1e";

				next();
			},
		);
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		await clearDatabase();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test("expect to return share links for a folder", async () => {
		const response = await agent
			.get("/api/v2/folder/2/share_links")
			.expect(200);

		const shareLinks = (response.body as { items: ShareLink[] }).items;
		expect(shareLinks.length).toEqual(3);

		const shareLink = shareLinks.find((link) => link.id === "1");
		expect(shareLink?.id).toEqual("1");
		expect(shareLink?.itemId).toEqual("2");
		expect(shareLink?.itemType).toEqual("folder");
		expect(shareLink?.token).toEqual("c0f523e4-48d8-4c39-8cda-5e95161532e4");
		expect(shareLink?.permissionsLevel).toEqual("viewer");
		expect(shareLink?.accessRestrictions).toEqual("none");
		expect(shareLink?.maxUses).toEqual(null);
		expect(shareLink?.usesExpended).toEqual(null);
		expect(shareLink?.expirationTimestamp).toEqual(null);
	});

	test("expect an empty list if folder doesn't exist", async () => {
		const response = await agent
			.get("/api/v2/folder/999/share_links")
			.expect(200);

		const shareLinks = (response.body as { items: ShareLink[] }).items;
		expect(shareLinks.length).toEqual(0);
	});

	test("expect empty list if user doesn't have access to the folder's share links", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{ userSubjectFromAuthToken?: string; emailFromAuthToken?: string }
				>,
				__,
				next: NextFunction,
			) => {
				req.body.emailFromAuthToken = "test+1@permanent.org";
				req.body.userSubjectFromAuthToken =
					"b5461dc2-1eb0-450e-b710-fef7b2cafe1e";

				next();
			},
		);
		const response = await agent
			.get("/api/v2/folder/2/share_links")
			.expect(200);

		const shareLinks = (response.body as { items: ShareLink[] }).items;
		expect(shareLinks.length).toEqual(0);
	});

	test("expect to log error and return 500 if database lookup fails", async () => {
		const testError = new Error("test error");
		jest.spyOn(db, "sql").mockImplementation(async () => {
			throw testError;
		});

		await agent.get("/api/v2/folder/1/share_links").expect(500);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("expect 401 if not authenticated", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			(_, __, next: NextFunction) => {
				next(createError.Unauthorized("Invalid auth token"));
			},
		);
		await agent.get("/api/v2/folder/1/share_links").expect(401);
	});

	test("expect 400 if the header values are missing", async () => {
		(verifyUserAuthentication as jest.Mock).mockImplementation(
			(_, __, next: NextFunction) => {
				next();
			},
		);
		await agent.get("/api/v2/folder/1/share_links").expect(400);
	});
});
