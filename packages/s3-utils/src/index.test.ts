import { getSignedUrl } from "aws-cloudfront-sign";
import { constructSignedCdnUrl } from "./index";
jest.mock("aws-cloudfront-sign");

describe("constructSignedCDNURL", () => {
  test("calls getSignedUrl correctly when no fileName is provided", () => {
    const mockCloudfrontUrl = "https://test.permanent.org/";
    process.env["CLOUDFRONT_URL"] = mockCloudfrontUrl;
    const testKey = "test-key";
    constructSignedCdnUrl(testKey);

    expect(getSignedUrl).toHaveBeenCalledWith(
      `${mockCloudfrontUrl}${testKey}`,
      expect.anything()
    );
  });

  test("calls getSignedUrl correctly when fileName is provided", () => {
    const mockCloudfrontUrl = "https://test.permanent.org/";
    process.env["CLOUDFRONT_URL"] = mockCloudfrontUrl;
    const testKey = "test-key";
    const testFileName = "test-file.txt";
    constructSignedCdnUrl(testKey, testFileName);

    expect(getSignedUrl).toHaveBeenCalledWith(
      `${mockCloudfrontUrl}${testKey}?response-content-disposition=${testFileName}`,
      expect.anything()
    );
  });
});
