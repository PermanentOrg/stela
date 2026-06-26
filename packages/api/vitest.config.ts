import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import os from "node:os";

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^@stela\/(.+)$/,
				replacement: fileURLToPath(new URL("../$1/src", import.meta.url)),
			},
		],
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./vitest.env.setup.js"],
		globalSetup: ["./vitest.db.setup.ts"],
		exclude: ["**/dist/**", "**/node_modules/**"],
		coverage: {
			clean: false,
		},
		pool: "threads",
		poolOptions: {
			threads: {
				minThreads: Math.max(1, Math.floor(os.availableParallelism() / 2)),
				maxThreads: Math.max(1, Math.floor(os.availableParallelism() / 2)),
			},
		},
	},
});
