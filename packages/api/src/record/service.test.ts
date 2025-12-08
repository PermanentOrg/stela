import createError from "http-errors";
import { buildPatchQuery } from "./service";
import type { RecordColumnsForUpdate } from "./models";

describe("buildPatchQuery", () => {
	test("should throw BadRequest error when no updates are provided", () => {
		const columnsForUpdate: RecordColumnsForUpdate = {
			recordId: "1",
			locnid: undefined,
			description: undefined,
			displayname: undefined,
		};

		expect(() => buildPatchQuery(columnsForUpdate)).toThrow(
			createError.BadRequest("Request cannot be empty"),
		);
	});
});
