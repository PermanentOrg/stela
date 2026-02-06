import * as path from "node:path";
import { TinyPg } from "tinypg";

// Use worker-specific databases to enable parallel test execution
// Each Jest worker gets its own isolated database
const workerId = process.env["JEST_WORKER_ID"] ?? "1";
const dbName = `test_permanent_worker_${workerId}`;

const db = new TinyPg({
	connection_string: `postgres://postgres:permanent@database:5432/${dbName}`,
	root_dir: [path.resolve(__dirname, "..")],
	capture_stack_trace: true,
});

export { db };
