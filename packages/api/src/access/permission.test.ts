import createError from "http-errors";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import {
	getArchiveAccessRole,
	getRecordAccessRole,
	getFolderAccessRole,
	isItemPublic,
	leastPermissiveAccessRole,
	mostPermissiveAccessRole,
	resolveAccessRole,
} from "./permission.js";
import { AccessRole, ArchiveMembershipRole } from "./models.js";
import { db } from "../database.js";
import { runFixtures } from "../../test/run_fixtures.js";

vi.mock("../database");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"access.fixtures.create_test_accounts",
		"access.fixtures.create_test_archives",
		"access.fixtures.create_test_account_archives",
		"access.fixtures.create_test_records",
		"access.fixtures.create_test_folders",
		"access.fixtures.create_test_folder_links",
		"access.fixtures.create_test_accesses",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, account_archive, record, folder, access, folder_link CASCADE",
	);
};

describe("getArchiveAccessRole", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should get access role from account_archive", async () => {
		const accessRole = await getArchiveAccessRole("1", "test@permanent.org");
		expect(accessRole).toEqual(AccessRole.Owner);
	});

	test("should throw a not found error if account has no membership in the archive", async () => {
		let error = null;
		try {
			await getArchiveAccessRole("2", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted account_archives", async () => {
		let error = null;
		try {
			await getArchiveAccessRole("4", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted accounts", async () => {
		let error = null;
		try {
			await getArchiveAccessRole("1", "test+2@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should throw internal server error if the database call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		let error = null;
		try {
			await getArchiveAccessRole("1", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(
				createError.InternalServerError("Failed to access database"),
			);
		}
	});
});

describe("getRecordAccessRole", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should get access role from account_archive", async () => {
		const accessLevel = await getRecordAccessRole("1", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Owner);
	});

	test("should throw a not found error if account has no access to record", async () => {
		let error = null;
		try {
			await getRecordAccessRole("2", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should get access role from access entry (i.e., a share)", async () => {
		const accessLevel = await getRecordAccessRole("3", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Viewer);
	});

	test("should use the more permissive access role, if access exists from both a share and an archive membership", async () => {
		const accessLevel = await getRecordAccessRole("4", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Manager);
	});

	test("should ignore deleted account_archives", async () => {
		let error = null;
		try {
			await getRecordAccessRole("5", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted accounts", async () => {
		let error = null;
		try {
			await getRecordAccessRole("1", "test+2@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted records", async () => {
		let error = null;
		try {
			await getRecordAccessRole("6", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted shares", async () => {
		let error = null;
		try {
			await getRecordAccessRole("7", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted folder_links", async () => {
		let error = null;
		try {
			await getRecordAccessRole("8", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should throw internal server error if the database call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		let error = null;
		try {
			await getRecordAccessRole("1", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(
				createError.InternalServerError("Failed to access database"),
			);
		}
	});

	test("should throw not found error if the all access roles returned are null", async () => {
		vi.spyOn(db, "sql").mockImplementation(
			vi.fn().mockResolvedValue({
				rows: [
					{ archiveAccessRole: null, shareAccessRole: null },
					{ archiveAccessRole: null, shareAccessRole: null },
				],
			}),
		);
		let error = null;
		try {
			await getRecordAccessRole("1", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});
});

describe("getFolderAccessRole", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterAll(async () => {
		await clearDatabase();
	});

	test("should get access role from account_archive", async () => {
		const accessLevel = await getFolderAccessRole("1", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Owner);
	});

	test("should throw a not found error if account has no access to folder", async () => {
		let error = null;
		try {
			await getFolderAccessRole("2", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should get access role from access entry (i.e., a share)", async () => {
		const accessLevel = await getFolderAccessRole("3", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Viewer);
	});

	test("should use the more permissive access role, if access exists from both a share and an archive membership", async () => {
		const accessLevel = await getFolderAccessRole("4", "test@permanent.org");
		expect(accessLevel).toEqual(AccessRole.Manager);
	});

	test("should ignore deleted account_archives", async () => {
		let error = null;
		try {
			await getFolderAccessRole("5", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted accounts", async () => {
		let error = null;
		try {
			await getFolderAccessRole("1", "test+2@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted folders", async () => {
		let error = null;
		try {
			await getFolderAccessRole("6", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted shares", async () => {
		let error = null;
		try {
			await getFolderAccessRole("7", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});

	test("should ignore deleted folder_links", async () => {
		let error = null;
		try {
			await getFolderAccessRole("8", "test@permanent.org");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(createError.NotFound());
		}
	});
});

describe("isItemPublic", () => {
	beforeEach(async () => {
		await clearDatabase();
		await loadFixtures();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await clearDatabase();
	});
	test("should return true for a public record", async () => {
		const isPublic = await isItemPublic("9", "record");
		expect(isPublic).toEqual(true);
	});
	test("should return false for a private record", async () => {
		const isPublic = await isItemPublic("1", "record");
		expect(isPublic).toEqual(false);
	});
	test("should return true for a public folder", async () => {
		const isPublic = await isItemPublic("9", "folder");
		expect(isPublic).toEqual(true);
	});
	test("should return false for a private folder", async () => {
		const isPublic = await isItemPublic("1", "folder");
		expect(isPublic).toEqual(false);
	});
	test("should throw a 500 error if database call fails", async () => {
		vi.spyOn(db, "sql").mockRejectedValue(new Error("Test error"));
		let error = null;
		try {
			await isItemPublic("1", "folder");
		} catch (err) {
			error = err;
		} finally {
			expect(error).toEqual(
				createError.InternalServerError("Failed to access database"),
			);
		}
	});
});

describe("leastPermissiveAccessRole", () => {
	test("returns the lesser of two roles", () => {
		expect(
			leastPermissiveAccessRole(AccessRole.Owner, AccessRole.Viewer),
		).toEqual(AccessRole.Viewer);
	});

	test("returns the other role when one side is null", () => {
		expect(leastPermissiveAccessRole(null, AccessRole.Editor)).toEqual(
			AccessRole.Editor,
		);
		expect(leastPermissiveAccessRole(AccessRole.Editor, null)).toEqual(
			AccessRole.Editor,
		);
	});

	test("returns null when both sides are null", () => {
		expect(leastPermissiveAccessRole(null, null)).toBeNull();
	});
});

describe("mostPermissiveAccessRole", () => {
	test("returns the greatest role among the list", () => {
		expect(
			mostPermissiveAccessRole([
				AccessRole.Viewer,
				AccessRole.Manager,
				AccessRole.Contributor,
			]),
		).toEqual(AccessRole.Manager);
	});

	test("ignores null and undefined entries", () => {
		expect(
			mostPermissiveAccessRole([null, undefined, AccessRole.Curator]),
		).toEqual(AccessRole.Curator);
	});

	test("returns null when every entry is null, undefined, or the list is empty", () => {
		expect(mostPermissiveAccessRole([null, undefined])).toBeNull();
		expect(mostPermissiveAccessRole([])).toBeNull();
	});
});

describe("resolveAccessRole", () => {
	test("returns the archive membership role when it is the only applicable path", () => {
		const accessRole = resolveAccessRole({
			archiveAccessRole: AccessRole.Owner,
			shareAccessRoles: null,
			shareTokenGrantsAccess: false,
			isPublic: false,
		});
		expect(accessRole).toEqual(ArchiveMembershipRole.Owner);
	});

	test("caps a share's role at the sharing archive's own membership role", () => {
		const accessRole = resolveAccessRole({
			archiveAccessRole: null,
			shareAccessRoles: [
				{
					archiveAccessRole: AccessRole.Viewer,
					shareAccessRole: AccessRole.Manager,
				},
			],
			shareTokenGrantsAccess: false,
			isPublic: false,
		});
		expect(accessRole).toEqual(ArchiveMembershipRole.Viewer);
	});

	test("returns the most permissive role across every applicable path", () => {
		const accessRole = resolveAccessRole({
			archiveAccessRole: AccessRole.Viewer,
			shareAccessRoles: [
				{
					archiveAccessRole: AccessRole.Manager,
					shareAccessRole: AccessRole.Curator,
				},
			],
			shareTokenGrantsAccess: true,
			isPublic: true,
		});
		expect(accessRole).toEqual(ArchiveMembershipRole.Curator);
	});

	test("grants viewer access via a share token alone", () => {
		const accessRole = resolveAccessRole({
			archiveAccessRole: null,
			shareAccessRoles: null,
			shareTokenGrantsAccess: true,
			isPublic: false,
		});
		expect(accessRole).toEqual(ArchiveMembershipRole.Viewer);
	});

	test("grants viewer access via public access alone", () => {
		const accessRole = resolveAccessRole({
			archiveAccessRole: null,
			shareAccessRoles: null,
			shareTokenGrantsAccess: false,
			isPublic: true,
		});
		expect(accessRole).toEqual(ArchiveMembershipRole.Viewer);
	});

	test("throws an internal server error when no access path applies", () => {
		expect(() =>
			resolveAccessRole({
				archiveAccessRole: null,
				shareAccessRoles: null,
				shareTokenGrantsAccess: false,
				isPublic: false,
			}),
		).toThrow(
			createError.InternalServerError(
				"Unable to resolve caller's access role for item",
			),
		);
	});
});
