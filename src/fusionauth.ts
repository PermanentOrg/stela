import { FusionAuthClient } from "@fusionauth/typescript-client";

const fusionAuthClient = new FusionAuthClient(
  process.env["FUSIONAUTH_API_KEY"] ?? "",
  process.env["FUSIONAUTH_HOST"] ?? "",
  process.env["FUSIONAUTH_TENANT"] ?? ""
);

export { fusionAuthClient };
