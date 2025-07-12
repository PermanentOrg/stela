import { FusionAuthClient } from "@fusionauth/typescript-client";
import memoize from "memoizee";

const baseFusionAuthClient = new FusionAuthClient(
	process.env["FUSIONAUTH_API_KEY"] ?? "",
	process.env["FUSIONAUTH_HOST"] ?? "",
	process.env["FUSIONAUTH_TENANT"] ?? "",
);

const memoizedIntrospectAccessToken = memoize(
	baseFusionAuthClient.introspectAccessToken.bind(baseFusionAuthClient),
	{ maxAge: 10000 },
);

const fusionAuthClient: Omit<FusionAuthClient, "introspectAccessToken"> & {
	introspectAccessToken: typeof memoizedIntrospectAccessToken;
} = Object.assign({}, baseFusionAuthClient, {
	introspectAccessToken: memoizedIntrospectAccessToken,
});

export { fusionAuthClient };
