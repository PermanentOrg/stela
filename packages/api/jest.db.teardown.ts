import pg from "pg";
import os from "node:os";

const { Client } = pg;

const TEMPLATE_DATABASE_NAME = "test_permanent_template";

export default async function globalTeardown(): Promise<void> {
	const client = new Client({
		connectionString: "postgres://postgres:permanent@database/postgres",
	});
	await client.connect();

	try {
		const numWorkers = os.cpus().length / 2;

		// Terminate connections and drop worker databases
		for (let i = 1; i <= numWorkers; i++) {
			const workerDbName = `test_permanent_worker_${i}`;

			// Terminate any remaining connections
			await client.query(`
				SELECT pg_terminate_backend(pg_stat_activity.pid)
				FROM pg_stat_activity
				WHERE pg_stat_activity.datname = '${workerDbName}'
				AND pid <> pg_backend_pid()
			`);

			await client.query(`DROP DATABASE IF EXISTS ${workerDbName}`);
		}

		// Drop the template database
		await client.query(`
			SELECT pg_terminate_backend(pg_stat_activity.pid)
			FROM pg_stat_activity
			WHERE pg_stat_activity.datname = '${TEMPLATE_DATABASE_NAME}'
			AND pid <> pg_backend_pid()
		`);
		await client.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DATABASE_NAME}`);
	} finally {
		await client.end();
	}
}
