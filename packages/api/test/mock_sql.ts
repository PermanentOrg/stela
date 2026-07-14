import { vi } from "vitest";
import { equals } from "@vitest/expect";
import type { Result, TinyPg, TinyPgParams } from "tinypg";

type MockSqlBehavior =
	| { reject: unknown }
	| { resolve: Partial<Result<object>> & { rows: unknown[] } };

/**
 * Stubs a single named `db.sql` query while leaving every other query to hit
 * the real database. `vitest-when`'s `calledWith(...).thenReject/thenDo(...)`
 * can't be used for this: its fallback for non-matching calls relies on
 * Vitest internals that no longer exist as of Vitest 4, so any unmatched
 * call silently returns `undefined` instead of running for real.
 */
export const mockSqlCall = (
	db: TinyPg,
	queryName: string,
	params: unknown,
	behavior: MockSqlBehavior,
): void => {
	const originalSql = db.sql.bind(db);
	vi.spyOn(db, "sql").mockImplementation(
		async (name: string, actualParams?: TinyPgParams) => {
			if (name === queryName && equals(actualParams, params)) {
				if ("reject" in behavior) {
					throw behavior.reject;
				}
				return {
					command: "",
					row_count: behavior.resolve.rows.length,
					...behavior.resolve,
				};
			}
			return originalSql(name, actualParams);
		},
	);
};
