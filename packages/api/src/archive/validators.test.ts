import { validateArchiveIdFromParams } from "./validators";

describe("validateArchiveIdFromParams", () => {
	test("should find no errors in valid parameters", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({
				archiveId: "123",
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).toBeNull();
		}
	});

	test("should error if archiveId is missing", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});

	test("should error if archiveId is wrong type", () => {
		let error = null;
		try {
			validateArchiveIdFromParams({
				archiveId: 123,
			});
		} catch (err) {
			error = err;
		} finally {
			expect(error).not.toBeNull();
		}
	});
});
