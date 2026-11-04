import sharp from "sharp";
import type { Sharp } from "sharp";

// HEIF files start with an ISO-BMFF "ftyp" box: 4-byte box size, the "ftyp" box type,
// a 4-byte major brand, a 4-byte minor version, then a list of 4-byte compatible brands.
const BOX_SIZE_LENGTH = 4;
const BOX_TYPE_OFFSET = 4;
const MAJOR_BRAND_OFFSET = 8;
const COMPATIBLE_BRANDS_OFFSET = 16;
const BRAND_LENGTH = 4;
const RGBA_CHANNELS = 4;

// Brands indicating HEVC-coded images or sequences. Generic HEIF brands such as "mif1" are
// deliberately excluded, since AVIF files use them too and sharp can decode AVIF natively.
const HEVC_BRANDS = new Set([
	"heic",
	"heix",
	"heim",
	"heis",
	"hevc",
	"hevx",
	"hevm",
	"hevs",
]);

const readAscii = (image: Uint8Array, start: number, length: number): string =>
	String.fromCharCode(...image.subarray(start, start + length));

export const isHevcHeif = (image: Uint8Array): boolean => {
	if (image.length < COMPATIBLE_BRANDS_OFFSET) {
		return false;
	}
	if (readAscii(image, BOX_TYPE_OFFSET, BRAND_LENGTH) !== "ftyp") {
		return false;
	}
	const ftypBoxSize = new DataView(
		image.buffer,
		image.byteOffset,
		BOX_SIZE_LENGTH,
	).getUint32(0);
	const brands = [readAscii(image, MAJOR_BRAND_OFFSET, BRAND_LENGTH)];
	for (
		let offset = COMPATIBLE_BRANDS_OFFSET;
		offset + BRAND_LENGTH <= Math.min(ftypBoxSize, image.length);
		offset += BRAND_LENGTH
	) {
		brands.push(readAscii(image, offset, BRAND_LENGTH));
	}
	return brands.some((brand) => HEVC_BRANDS.has(brand));
};

// Decodes the primary image of a HEIC file with libheif (compiled to WebAssembly, and
// including the libde265 HEVC decoder) and hands the raw pixels to sharp. libheif applies
// the image's rotation/mirroring properties while decoding, so the result is already upright.
export const loadHeic = async (image: Uint8Array): Promise<Sharp> => {
	// Imported lazily because the WebAssembly bundle is large and most images don't need it
	const { default: decode } = await import("heic-decode");
	const { width, height, data } = await decode({ buffer: image });
	return sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
		raw: { width, height, channels: RGBA_CHANNELS },
	});
};
