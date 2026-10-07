import { afterEach, describe, expect, test, vi } from "vitest";
import { db } from "../../../database.js";

vi.mock("../../../database");

const clearDatabase = async (): Promise<void> => {
	await db.query("TRUNCATE archive, archive_nbr CASCADE");
};

describe("archive.queries.create_archive", () => {
	afterEach(async () => {
		await clearDatabase();
	});

	test("should create the first archive with archivePart 0000", async () => {
		const result = await db.sql<{ archiveId: string; archiveNbr: string }>(
			"archive.queries.create_archive",
			{ archiveType: "type.archive.person" },
		);
		const { rows } = result;
		const [archive] = rows;
		expect(archive?.archiveNbr).toEqual("0000-0000");
	});

	test("should increment the archive part for a second archive", async () => {
		await db.sql("archive.queries.create_archive", {
			archiveType: "type.archive.person",
		});
		const result = await db.sql<{ archiveId: string; archiveNbr: string }>(
			"archive.queries.create_archive",
			{ archiveType: "type.archive.organization" },
		);
		const { rows } = result;
		const [archive] = rows;
		expect(archive?.archiveNbr).toEqual("0001-0000");
	});

	test("should set defaults matching a freshly created archive", async () => {
		const result = await db.sql<{
			public: boolean;
			allowPublicDownload: boolean;
			status: string;
			type: string;
		}>("archive.queries.create_archive", {
			archiveType: "type.archive.family",
		});
		const { rows } = result;
		const [archive] = rows;
		expect(archive?.public).toEqual(false);
		expect(archive?.allowPublicDownload).toEqual(true);
		expect(archive?.status).toEqual("status.generic.ok");
		expect(archive?.type).toEqual("type.archive.family");
	});

	test("should create a matching archive_nbr row", async () => {
		const result = await db.sql<{ archiveId: string; archiveNbr: string }>(
			"archive.queries.create_archive",
			{ archiveType: "type.archive.person" },
		);
		const { rows } = result;
		const [archive] = rows;
		const archiveNbrResult = await db.query<{
			reftable: string;
			refid: string;
			archivepart: string;
			itempart: string;
		}>("SELECT reftable, refid, archivepart, itempart FROM archive_nbr");
		const { rows: archiveNbrRows } = archiveNbrResult;
		const [archiveNbrRow] = archiveNbrRows;
		expect(archiveNbrRow?.reftable).toEqual("archive");
		expect(archiveNbrRow?.refid).toEqual(archive?.archiveId);
		expect(archiveNbrRow?.archivepart).toEqual("0000");
		expect(archiveNbrRow?.itempart).toEqual("0000");
	});
});
