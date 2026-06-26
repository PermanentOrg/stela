// last updated: 2026-06-19 00:37 GMT
// updated by: Liam Lloyd-Tucker
import { exec } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";
import os from "node:os";

const execAsync = promisify(exec);
const { Client } = pg;

const TEMPLATE_DATABASE_NAME = "test_permanent_template";
const GOLDEN_DATABASE_NAME = "permanent";

export async function setup(): Promise<void> {
	const client = new Client({
		connectionString: "postgres://postgres:permanent@database/postgres",
	});
	await client.connect();

	try {
		await client.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DATABASE_NAME}`);
		await client.query(`CREATE DATABASE ${TEMPLATE_DATABASE_NAME}`);
		await client.end();

		await execAsync(
			`pg_dump postgresql://postgres:permanent@database/${GOLDEN_DATABASE_NAME} --schema-only | psql postgresql://postgres:permanent@database/${TEMPLATE_DATABASE_NAME}`,
		);

		// Create worker-specific databases from the template
		// We've configured vitest to use a number of workers equal to half the number of CPUs
		const numWorkers = Math.max(1, Math.floor(os.availableParallelism() / 2));

		const adminClient = new Client({
			connectionString: "postgres://postgres:permanent@database/postgres",
		});
		await adminClient.connect();

		try {
			for (let i = 1; i <= numWorkers; i++) {
				const workerDbName = `test_permanent_worker_${i}`;
				await adminClient.query(`DROP DATABASE IF EXISTS ${workerDbName}`);
				await adminClient.query(
					`CREATE DATABASE ${workerDbName} TEMPLATE ${TEMPLATE_DATABASE_NAME}`,
				);
			}
		} finally {
			await adminClient.end();
		}
	} catch (error) {
		await client.end();
		throw error;
	}
}

export async function teardown(): Promise<void> {
	const client = new Client({
		connectionString: "postgres://postgres:permanent@database/postgres",
	});
	await client.connect();

	try {
		const numWorkers = Math.max(1, Math.floor(os.availableParallelism() / 2));

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
