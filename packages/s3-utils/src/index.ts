import { getSignedUrl } from "aws-cloudfront-sign";

const yearsUntilCdnUrlExpiration = 1;

export const constructSignedCdnUrl = (
  key: string,
  fileName?: string
): string => {
  let url = `${process.env["CLOUDFRONT_URL"] ?? ""}${key}`;
  if (fileName) {
    const urlObject = new URL(url);
    urlObject.searchParams.append("response-content-disposition", fileName);
    url = urlObject.toString();
  }
  const expirationTime = new Date();
  expirationTime.setFullYear(
    expirationTime.getFullYear() + yearsUntilCdnUrlExpiration
  );

  return getSignedUrl(url, {
    expireTime: expirationTime.getTime(),
    keypairId: process.env["CLOUDFRONT_KEY_PAIR_ID"] ?? "",
    privateKeyString: process.env["CLOUDFRONT_PRIVATE_KEY"] ?? "",
  });
};
