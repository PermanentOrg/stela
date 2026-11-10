import { readFileSync } from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import { isHevcHeif, loadHeic } from "./heic.js";

const sampleHeic = new Uint8Array(
	readFileSync(path.join(import.meta.dirname, "../test-data/sample.heic")),
);

const buildFtypHeader = (
	majorBrand: string,
	compatibleBrands: string[],
): Uint8Array => {
	const brands = [majorBrand, "\0\0\0\0", ...compatibleBrands].join("");
	const boxSize = 8 + brands.length;
	const header = new Uint8Array(boxSize);
	new DataView(header.buffer).setUint32(0, boxSize);
	header.set(Buffer.from(`ftyp${brands}`, "latin1"), 4);
	return header;
};

describe("isHevcHeif", () => {
	test("should recognise a HEIC file", () => {
		expect(isHevcHeif(sampleHeic)).toBe(true);
	});

	test("should recognise a HEVC brand among the compatible brands", () => {
		expect(isHevcHeif(buildFtypHeader("mif1", ["miaf", "heic"]))).toBe(true);
	});

	test("should not treat AVIF files as HEIC", () => {
		expect(isHevcHeif(buildFtypHeader("avif", ["mif1", "miaf"]))).toBe(false);
		expect(isHevcHeif(buildFtypHeader("mif1", ["avif", "miaf"]))).toBe(false);
	});

	test("should not treat other images as HEIC", async () => {
		const png = await sharp({
			create: { width: 10, height: 10, channels: 3, background: "red" },
		})
			.png()
			.toBuffer();
		expect(isHevcHeif(new Uint8Array(png))).toBe(false);
	});

	test("should handle inputs too short to contain a ftyp box", () => {
		expect(isHevcHeif(new Uint8Array([0, 0, 0]))).toBe(false);
	});
});

describe("loadHeic", () => {
	test("should decode a HEIC file into an image sharp can process", async () => {
		const decoded = await loadHeic(sampleHeic);
		const { info } = await decoded.png().toBuffer({ resolveWithObject: true });
		expect(info.width).toEqual(512);
		expect(info.height).toEqual(256);
	});
});
