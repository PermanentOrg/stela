import type { TinyPg } from "tinypg";

export const runFixtures = async (
	db: TinyPg,
	names: string[],
): Promise<void> => {
	const sql = names
		.map((name) => {
			const { sql_db_calls: sqlDbCalls } = db;
			const { [name]: dbCall } = sqlDbCalls;
			if (dbCall === undefined) {
				throw new Error(`Sql query with name [${name}] not found!`);
			}
			return dbCall.config.text;
		})
		.join(";\n");

	await db.query(sql);
};
