import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { db } from "../../database.js";
import { createDefaultFolders } from "./create_default_folders.js";
import { runFixtures } from "../../../test/run_fixtures.js";

vi.mock("../../database");

const loadFixtures = async (): Promise<void> => {
	await runFixtures(db, [
		"folder.fixtures.create_test_accounts",
		"folder.fixtures.create_test_archives",
	]);
};

const clearDatabase = async (): Promise<void> => {
	await db.query(
		"TRUNCATE account, archive, archive_nbr, folder, folder_link CASCADE",
	);
};

describe("createDefaultFolders", () => {
	beforeEach(async () => {
		await loadFixtures();
	});
	afterEach(async () => {
		await clearDatabase();
	});

	test("should create a root folder and 3 children", async () => {
		const archiveId = "1";
		const { rootFolderId } = await createDefaultFolders(archiveId, "0000", db);

		const foldersResult = await db.query<{
			displayname: string;
			type: string;
			description: string | null;
			publicdt: Date | null;
		}>(
			"SELECT displayname, type, description, publicdt FROM folder WHERE archiveid = :archiveId ORDER BY folderid",
			{ archiveId },
		);
		const { rows: folderRows } = foldersResult;
		expect(folderRows).toHaveLength(4);
		const [root, apps, myFiles, publicFolder] = folderRows;
		expect(root).toMatchObject({
			displayname: "Archive Root",
			type: "type.folder.root.root",
			description: null,
		});
		expect(apps).toMatchObject({
			displayname: "Apps",
			type: "type.folder.root.app",
			description: "pages.apps.description",
		});
		expect(myFiles).toMatchObject({
			displayname: "My Files",
			type: "type.folder.root.private",
			description: "pages.private.description",
		});
		expect(publicFolder).toMatchObject({
			displayname: "Public",
			type: "type.folder.root.public",
			description: "pages.public.description",
		});
		expect(publicFolder?.publicdt).not.toBeNull();

		const rootRow = await db.query<{ folderid: string }>(
			"SELECT folderid FROM folder WHERE type = 'type.folder.root.root' AND archiveid = :archiveId",
			{ archiveId },
		);
		expect(rootFolderId).toEqual(rootRow.rows[0]?.folderid);
	});

	test("should link all 3 children under the root folder_link", async () => {
		const archiveId = "1";
		const { rootFolderId } = await createDefaultFolders(archiveId, "0000", db);

		const rootLinkResult = await db.query<{ folder_linkid: string }>(
			"SELECT folder_linkid FROM folder_link WHERE folderid = :rootFolderId",
			{ rootFolderId },
		);
		const rootLinkId = rootLinkResult.rows[0]?.folder_linkid;

		const childLinksResult = await db.query<{
			parentfolderid: string;
			parentfolder_linkid: string;
			accessrole: string;
			position: string;
		}>(
			"SELECT parentfolderid, parentfolder_linkid, accessrole, position FROM folder_link WHERE parentFolderId = :rootFolderId",
			{ rootFolderId, archiveId },
		);
		expect(childLinksResult.rows).toHaveLength(3);
		childLinksResult.rows.forEach((row) => {
			expect(row.parentfolderid).toEqual(rootFolderId);
			expect(row.parentfolder_linkid).toEqual(rootLinkId);
			expect(row.accessrole).toEqual("access.role.owner");
		});
	});

	test("should assign sequential archive_nbr item parts starting at 0001", async () => {
		const archiveId = "1";
		await createDefaultFolders(archiveId, "0000", db);

		const result = await db.query<{ itempart: string }>(
			"SELECT itempart FROM archive_nbr WHERE reftable = 'folder' ORDER BY itempart",
		);
		expect(result.rows.map((row) => row.itempart)).toEqual([
			"0001",
			"0002",
			"0003",
			"0004",
		]);
	});
});
