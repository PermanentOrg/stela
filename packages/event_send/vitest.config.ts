import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

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
	},
});
