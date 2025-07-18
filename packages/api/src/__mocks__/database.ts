import * as path from "node:path";
import { TinyPg } from "tinypg";

const db = new TinyPg({
	connection_string:
		"postgres://postgres:permanent@database:5432/test_permanent",
	root_dir: [path.resolve(__dirname, "..")],
	capture_stack_trace: true,
});

export { db };
