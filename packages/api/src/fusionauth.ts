import { FusionAuthClient } from "@fusionauth/typescript-client";
import memoize from "memoizee";

class MemoizedFusionAuthClient extends FusionAuthClient {
	override introspectAccessToken = memoize(
		super.introspectAccessToken.bind(this),
		{ maxAge: 10000 },
	);
}

const fusionAuthClient = new MemoizedFusionAuthClient(
	process.env["FUSIONAUTH_API_KEY"] ?? "",
	process.env["FUSIONAUTH_HOST"] ?? "",
	process.env["FUSIONAUTH_TENANT"] ?? "",
);

export { fusionAuthClient };
