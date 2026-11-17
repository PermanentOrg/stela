import { vi } from "vitest";

const mixpanelClient = {
	track: vi.fn(),
};

export { mixpanelClient };
