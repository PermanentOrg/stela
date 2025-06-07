import { FusionAuthClient } from "@fusionauth/typescript-client";
import memoize from "memoizee";

const fusionAuthClient = new FusionAuthClient(
	process.env["FUSIONAUTH_API_KEY"] ?? "",
	process.env["FUSIONAUTH_HOST"] ?? "",
	process.env["FUSIONAUTH_TENANT"] ?? "",
);

fusionAuthClient.introspectAccessToken = memoize(
	fusionAuthClient.introspectAccessToken.bind(fusionAuthClient),
	{
		// memoizee has a `promise` mode, but it seems to change behavior of promise handling
		// in various ways that aren't clearly helpful, so I'm choosing to NOT use `promise: true`
		maxAge: 10000, // Results are cached for 10 seconds
	},
);

export { fusionAuthClient };
