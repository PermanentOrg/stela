import request from "supertest";
import type { Request, NextFunction } from "express";
import type { Response } from "node-fetch";
import { logger } from "@stela/logger";
import { app } from "../app";
import { db } from "../database";
import {
	verifyUserAuthentication,
	verifyAdminAuthentication,
} from "../middleware";
import { sendArchiveStewardNotification } from "../email";
import type {
	Directive,
	DirectiveTrigger,
	DirectiveExecutionResult,
} from "./model";
import { legacyClient } from "../legacy_client";

jest.mock("../database");
jest.mock("../middleware");
jest.mock("../email", () => ({
	sendArchiveStewardNotification: jest.fn(),
}));
jest.mock("@stela/logger");
jest.mock("../legacy_client");

const mockVerifyUserAuthentication = (
	testEmail: string,
	testSubject: string,
): void => {
	(verifyUserAuthentication as jest.Mock).mockImplementation(
		(req: Request, __, next: NextFunction) => {
			(
				req.body as {
					emailFromAuthToken: string;
					userSubjectFromAuthToken: string;
				}
			).emailFromAuthToken = testEmail;
			(
				req.body as {
					emailFromAuthToken: string;
					userSubjectFromAuthToken: string;
				}
			).userSubjectFromAuthToken = testSubject;
			next();
		},
	);
};

const mockVerifyAdminAuthentication = (
	testEmail: string,
	testSubject: string,
): void => {
	(verifyAdminAuthentication as jest.Mock).mockImplementation(
		(req: Request, __, next: NextFunction) => {
			(
				req.body as {
					emailFromAuthToken: string;
					adminSubjectFromAuthToken: string;
				}
			).emailFromAuthToken = testEmail;
			(
				req.body as {
					emailFromAuthToken: string;
					adminSubjectFromAuthToken: string;
				}
			).adminSubjectFromAuthToken = testSubject;
			next();
		},
	);
};

describe("GET /directive/archive/:archiveId", () => {
	const agent = request(app);

	const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";
	const testArchiveId = "1";
	const testEmail = "test@permanent.org";

	const loadFixtures = async (): Promise<void> => {
		await db.sql("directive.fixtures.create_test_accounts");
		await db.sql("directive.fixtures.create_test_archives");
		await db.sql("directive.fixtures.create_test_account_archives");
		await db.sql("directive.fixtures.create_test_directives");
		await db.sql("directive.fixtures.create_test_directive_triggers");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE",
		);
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			testEmail,
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
	});

	test("should return directive from the database", async () => {
		const response = await agent
			.get(`/api/v2/directive/archive/${testArchiveId}`)
			.expect(200);
		const responseBody = response.body as Directive[];
		expect(responseBody.length).toBe(1);
		expect(responseBody[0]?.directiveId).toBe(testDirectiveId);
	});

	test("should throw not found if archive doesn't exist", async () => {
		await agent.get("/api/v2/directive/archive/9999").expect(404);
	});

	test("should throw not found if account doesn't own archive", async () => {
		mockVerifyUserAuthentication(
			"test+1@permanent.org",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await agent.get(`/api/v2/directive/archive/${testArchiveId}`).expect(404);
	});

	test("should return empty list if there are no directives", async () => {
		await db.query("TRUNCATE directive, directive_trigger");
		const response = await agent
			.get(`/api/v2/directive/archive/${testArchiveId}`)
			.expect(200);
		const responseBody = response.body as Directive[];
		expect(responseBody.length).toBe(0);
	});

	test("should return 400 code if the request is invalid", async () => {
		mockVerifyUserAuthentication(
			"not_an_email",
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await agent.get(`/api/v2/directive/archive/${testArchiveId}`).expect(400);
	});
});

describe("POST /directive", () => {
	const agent = request(app);
	const testEmail = "test@permanent.org";
	const stewardEmail = "test+1@permanent.org";

	const loadFixtures = async (): Promise<void> => {
		await db.sql("directive.fixtures.create_test_accounts");
		await db.sql("directive.fixtures.create_test_archives");
		await db.sql("directive.fixtures.create_test_account_archives");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE",
		);
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			testEmail,
			"88420040-ec8d-4bc8-88f8-defaa74a05a5",
		);

		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should successfully create a directive and trigger", async () => {
		(
			sendArchiveStewardNotification as jest.MockedFunction<
				typeof sendArchiveStewardNotification
			>
		).mockResolvedValueOnce(undefined);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(200);

		const directiveResult = await db.query<Directive>(
			`SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        steward_account_id "stewardAccountId",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
			{ archiveId: 1 },
		);
		expect(directiveResult.rows.length).toBe(1);

		const triggerResult = await db.query<DirectiveTrigger>(
			`SELECT
        directive_trigger_id "directiveTriggerId",
        directive_id "directiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        directive_trigger
      WHERE
        directive_id = :directiveId`,
			{ directiveId: directiveResult.rows[0]?.directiveId },
		);
		expect(triggerResult.rows.length).toBe(1);
		expect(sendArchiveStewardNotification).toHaveBeenCalledWith(
			directiveResult.rows[0]?.directiveId,
		);
	});

	test("should log error if notification email fails", async () => {
		const testError = new Error("out of cheese error - redo from start");
		(
			sendArchiveStewardNotification as jest.MockedFunction<
				typeof sendArchiveStewardNotification
			>
		).mockRejectedValueOnce(testError);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(200);

		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should error if authenticated account doesn't own the archive", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"7da6781d-f21e-4f9a-8651-f456c05389db",
		);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(404);
	});

	test("should error if type is invalid", async () => {
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				type: "not_a_type",
				trigger: {
					type: "admin",
				},
			})
			.expect(400);
	});

	test("should error if trigger type is invalid", async () => {
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "date",
				},
			})
			.expect(400);
	});

	test("should error if steward account not found", async () => {
		jest.spyOn(db, "sql").mockImplementationOnce(
			(async () =>
				({
					rows: [{ hasAccess: true }],
				}) as object) as unknown as typeof db.sql,
		);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail: "nobody@permanent.org",
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(400);
	});

	test("should error if directive can't be created", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				(async () =>
					({
						rows: [{ hasAccess: true }],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce(
				(async () => ({ rows: [] }) as object) as unknown as typeof db.sql,
			);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(500);
	});

	test("should error if trigger can't be created", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				(async () =>
					({
						rows: [{ hasAccess: true }],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce(
				(async () =>
					({
						rows: [
							{
								directiveId: 1,
							},
						],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce(
				(async () => ({ rows: [] }) as object) as unknown as typeof db.sql,
			);
		await agent
			.post("/api/v2/directive/")
			.send({
				archiveId: "1",
				stewardEmail,
				type: "transfer",
				trigger: {
					type: "admin",
				},
			})
			.expect(500);
	});

	test("should return 400 if the request fails validation", async () => {
		await agent.post("/api/v2/directive/").send({}).expect(400);
	});
});

describe("PUT /directive/:directiveId", () => {
	const agent = request(app);

	const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";
	const testNote = "test note";

	const loadFixtures = async (): Promise<void> => {
		await db.sql("directive.fixtures.create_test_accounts");
		await db.sql("directive.fixtures.create_test_archives");
		await db.sql("directive.fixtures.create_test_account_archives");
		await db.sql("directive.fixtures.create_test_directives");
		await db.sql("directive.fixtures.create_test_directive_triggers");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE",
		);
	};

	beforeEach(async () => {
		mockVerifyUserAuthentication(
			"test@permanent.org",
			"9c19eb6c-32a6-4b6c-9f5f-b81ce8f30e5c",
		);
		await clearDatabase();
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
		jest.clearAllMocks();
	});

	test("should successfully update steward account and note", async () => {
		(
			sendArchiveStewardNotification as jest.MockedFunction<
				typeof sendArchiveStewardNotification
			>
		).mockResolvedValueOnce(undefined);
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+2@permanent.org",
				note: testNote,
			})
			.expect(200);

		const directiveResult = await db.query<Directive>(
			`SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        (
          SELECT
          jsonb_build_object(
            'email',
            primaryEmail,
            'name',
            fullName
          )
          FROM
            account
          WHERE
            accountId = steward_account_id
        ) "steward",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
			{ archiveId: 1 },
		);
		expect(directiveResult.rows.length).toBe(1);
		expect(directiveResult.rows[0]?.steward?.email).toBe(
			"test+2@permanent.org",
		);
		expect(directiveResult.rows[0]?.note).toBe(testNote);
		expect(directiveResult.rows[0]?.type).toBe("transfer");

		const triggerResult = await db.query<DirectiveTrigger>(
			`SELECT
        directive_trigger_id "directiveTriggerId",
        directive_id "directiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt"
      FROM
        directive_trigger
      WHERE
        directive_id = :directiveId`,
			{ directiveId: directiveResult.rows[0]?.directiveId },
		);
		expect(triggerResult.rows.length).toBe(1);
		expect(triggerResult.rows[0]?.type).toBe("admin");
		expect(sendArchiveStewardNotification).toHaveBeenCalledWith(
			testDirectiveId,
		);
	});

	test("should successfully update note only", async () => {
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				note: testNote,
			})
			.expect(200);

		const directiveResult = await db.query<Directive>(
			`SELECT 
        directive_id "directiveId",
        archive_id "archiveId",
        type,
        created_dt "createdDt",
        updated_dt "updatedDt",
        (
          SELECT
          jsonb_build_object(
            'email',
            primaryEmail,
            'name',
            fullName
          )
          FROM
            account
          WHERE
            accountId = steward_account_id
        ) "steward",
        note,
        execution_dt "executionDt"
      FROM
        directive
      WHERE
        archive_id = :archiveId`,
			{ archiveId: 1 },
		);
		expect(directiveResult.rows.length).toBe(1);
		expect(directiveResult.rows[0]?.steward?.email).toBe(
			"test+1@permanent.org",
		);
		expect(directiveResult.rows[0]?.note).toBe(testNote);
		expect(directiveResult.rows[0]?.type).toBe("transfer");

		expect(sendArchiveStewardNotification).toHaveBeenCalledTimes(0);
	});

	test("should log error if notification email fails", async () => {
		const testError = new Error("out of cheese error - redo from start");
		(
			sendArchiveStewardNotification as jest.MockedFunction<
				typeof sendArchiveStewardNotification
			>
		).mockRejectedValueOnce(testError);
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+2@permanent.org",
				note: testNote,
			})
			.expect(200);

		expect(sendArchiveStewardNotification).toHaveBeenCalledTimes(1);
		expect(logger.error).toHaveBeenCalledWith(testError);
	});

	test("should error if authenticated account doesn't own the directive", async () => {
		mockVerifyUserAuthentication(
			"test+2@permanent.org",
			"d8eb28ee-174c-4049-87f5-429b19054e49",
		);
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+3@permanent.org",
				note: testNote,
			})
			.expect(404);
	});

	test("should error if directive type is invalid", async () => {
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				note: testNote,
				type: "not_a_type",
			})
			.expect(400);
	});

	test("should error if steward email doesn't have an account", async () => {
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "not_an_account@permanent.org",
				note: testNote,
				type: "transfer",
			})
			.expect(400);
	});

	test("should error if trigger type is invalid", async () => {
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+2@permanent.org",
				note: testNote,
				trigger: {
					type: "not_a_type",
				},
			})
			.expect(400);
	});

	test("should error if directive is already executed", async () => {
		await db.sql("directive.queries.mark_directives_executed", {
			directiveIds: [testDirectiveId],
		});
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+2@permanent.org",
				note: testNote,
			})
			.expect(400);
	});

	test("should error if trigger update fails unexpectedly", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				(async () =>
					({
						rows: [{ hasAccess: true }],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce(
				(async () =>
					({
						rows: [
							{
								directiveId: testDirectiveId,
							},
						],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce(
				(async () => ({ rows: [] }) as object) as unknown as typeof db.sql,
			);

		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				stewardEmail: "test+2@permanent.org",
				note: testNote,
				trigger: {
					type: "admin",
				},
			})
			.expect(500);
	});

	test("should error if directive update fails unexpectedly", async () => {
		jest
			.spyOn(db, "sql")
			.mockImplementationOnce(
				(async () =>
					({
						rows: [{ hasAccess: true }],
					}) as object) as unknown as typeof db.sql,
			)
			.mockImplementationOnce((async () => {
				throw new Error("Out of cheese - redo from start");
			}) as unknown as typeof db.sql);

		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				note: testNote,
			})
			.expect(500);
	});

	test("should return 400 if request is invalid", async () => {
		await agent
			.put(`/api/v2/directive/${testDirectiveId}`)
			.send({
				note: testNote,
				stewardEmail: "not_an_email",
				trigger: {
					type: "admin",
				},
			})
			.expect(400);
	});
});

describe("POST /trigger/account/:accountId", () => {
	const agent = request(app);

	const testDirectiveId = "39b2a5fa-3508-4030-91b6-21dc6ec7a1ab";

	const loadFixtures = async (): Promise<void> => {
		await db.sql("directive.fixtures.create_test_accounts");
		await db.sql("directive.fixtures.create_test_archives");
		await db.sql("directive.fixtures.create_test_account_archives");
		await db.sql("directive.fixtures.create_test_directives");
		await db.sql("directive.fixtures.create_test_directive_triggers");
	};

	const clearDatabase = async (): Promise<void> => {
		await db.query(
			"TRUNCATE account, archive, account_archive, directive, directive_trigger CASCADE",
		);
	};

	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();

		mockVerifyAdminAuthentication(
			"test@permanent.org",
			"373f94fb-88f0-4acb-9638-9d554ec51520",
		);
	});
	afterEach(async () => {
		await clearDatabase();
	});

	test("should respond with success when transfer directive succesfully executed", async () => {
		jest
			.spyOn(legacyClient, "transferArchiveOwnership")
			.mockResolvedValue(Promise.resolve({ status: 200 } as Response));
		const response = await agent
			.post("/api/v2/directive/trigger/account/2")
			.expect(200);
		const responseBody = response.body as DirectiveExecutionResult[];
		expect(responseBody.length).toBe(1);
		expect(responseBody[0]?.outcome).toBe("success");

		const directiveResult = await db.query<Directive>(
			'SELECT execution_dt "executionDt" FROM directive WHERE directive_id = :testDirectiveId',
			{ testDirectiveId },
		);
		expect(directiveResult.rows[0]?.executionDt).toBeTruthy();
	});

	test("should respond with error when transfer directive fails to execute", async () => {
		jest
			.spyOn(legacyClient, "transferArchiveOwnership")
			.mockResolvedValue(Promise.resolve({ status: 500 } as Response));
		const response = await agent
			.post("/api/v2/directive/trigger/account/2")
			.expect(200);
		const responseBody = response.body as DirectiveExecutionResult[];
		expect(responseBody.length).toBe(1);
		expect(responseBody[0]?.outcome).toBe("error");
	});

	test("should not try to execute an already executed directive", async () => {
		await db.sql("directive.queries.mark_directives_executed", {
			directiveIds: [testDirectiveId],
		});
		const response = await agent
			.post("/api/v2/directive/trigger/account/2")
			.expect(200);
		const responseBody = response.body as DirectiveExecutionResult[];
		expect(responseBody.length).toBe(0);
	});

	test("should respond with error when transfer directive has unsupported type", async () => {
		jest.spyOn(db, "sql").mockResolvedValue({
			command: "",
			row_count: 1,
			rows: [{ type: "not_a_type" }],
		});
		const response = await agent
			.post("/api/v2/directive/trigger/account/2")
			.expect(200);
		const responseBody = response.body as DirectiveExecutionResult[];
		expect(responseBody.length).toBe(1);
		expect(responseBody[0]?.outcome).toBe("error");
	});

	test("should respond with a 400 error if the request is invalid", async () => {
		mockVerifyAdminAuthentication("not_an_email", "not_a_uuid");
		await agent.post("/api/v2/directive/trigger/account/2").expect(400);
	});

	test("should respond with a 500 error if the database call fails", async () => {
		jest.spyOn(db, "sql").mockImplementationOnce((async () => {
			throw new Error("Out of cheese - redo from start");
		}) as unknown as typeof db.sql);
		await agent.post("/api/v2/directive/trigger/account/2").expect(500);
	});
});
