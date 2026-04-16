import Mixpanel from "mixpanel";

const mixpanelClient = Mixpanel.init(
	process.env["MIXPANEL_TOKEN"] ?? "test_token",
);

export { mixpanelClient };
