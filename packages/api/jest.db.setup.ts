import { exec } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";

const execAsync = promisify(exec);
const { Client } = pg;

const TEST_DATABASE_NAME = "test_permanent";
const GOLDEN_DATABASE_NAME = "permanent";

export default async function globalSetup(): Promise<void> {
	const client = new Client({
		connectionString: "postgres://postgres:permanent@database/postgres",
	});
	await client.connect();

	await client.query(`DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME}`);
	await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
	await client.end();

	await execAsync(
		`pg_dump postgresql://postgres:permanent@database/${GOLDEN_DATABASE_NAME} --schema-only | psql postgresql://postgres:permanent@database/${TEST_DATABASE_NAME}`
	);
}
