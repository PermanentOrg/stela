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

baseFusionAuthClient.introspectAccessToken = memoizedIntrospectAccessToken;

// Simply replacing `introspectAccessToken` does not update the type of `baseFusionAuthClient`
// And so we need to do this type cast so that `introspectAccessToken`'s type signature reflects
// the additional `memoize` methods such as `.clear()`
const fusionAuthClient = baseFusionAuthClient as Omit<
	FusionAuthClient,
	"introspectAccesstoken"
> & { introspectAccessToken: typeof memoizedIntrospectAccessToken };

export { fusionAuthClient };
