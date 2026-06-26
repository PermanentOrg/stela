import * as path from "node:path";
import { TinyPg } from "tinypg";

// Use pool-slot-specific databases to enable parallel test execution.
// VITEST_POOL_ID is the pool-slot index (1…maxThreads), reused across files.
// VITEST_WORKER_ID is a globally unique per-file ID and must NOT be used here.
const workerId = process.env["VITEST_POOL_ID"] ?? "1";
const dbName = `test_permanent_worker_${workerId}`;

const db = new TinyPg({
	connection_string: `postgres://postgres:permanent@database:5432/${dbName}`,
	root_dir: [path.resolve(__dirname, "..")],
	capture_stack_trace: true,
});

export { db };
