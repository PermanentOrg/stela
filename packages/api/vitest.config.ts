import {
	mergeConfig,
	defineConfig,
	coverageConfigDefaults,
} from "vitest/config";
import os from "node:os";
import shared from "../../vitest.shared.js";

export default mergeConfig(
	shared,
	defineConfig({
		test: {
			setupFiles: ["./vitest.env.setup.js"],
			globalSetup: ["./vitest.db.setup.ts"],
			exclude: ["**/dist/**", "**/node_modules/**"],
			coverage: {
				clean: false,
				exclude: [
					...coverageConfigDefaults.exclude,
					"vitest.env.setup.js",
					"vitest.db.setup.ts",
				],
			},
			pool: "threads",
			maxWorkers: Math.max(1, Math.floor(os.availableParallelism() / 2)),
		},
	}),
);
