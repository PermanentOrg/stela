import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^@stela\/(.+)$/,
				replacement: fileURLToPath(new URL("./packages/$1/src", import.meta.url)),
			},
		],
	},
	test: {
		environment: "node",
	},
});
