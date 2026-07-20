import { mergeConfig, defineConfig } from "vitest/config";
import shared from "../../vitest.shared.js";

export default mergeConfig(
	shared,
	defineConfig({
		test: {
			setupFiles: ["./vitest.env.setup.js"],
		},
	}),
);
