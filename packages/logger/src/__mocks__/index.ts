import { vi } from "vitest";

export const logger = {
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	info: vi.fn(),
	http: vi.fn(),
	verbose: vi.fn(),
	debug: vi.fn(),
	silly: vi.fn(),
};
