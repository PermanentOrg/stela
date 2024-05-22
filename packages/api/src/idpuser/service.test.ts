import { fusionAuthClient } from "../fusionauth";
import { getTwoFactorMethods } from "./service";

jest.mock("../fusionauth");

describe("/idpuser", () => {
  const mockedFusionAuthClient = fusionAuthClient as jest.Mocked<
    typeof fusionAuthClient
  >;

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test("should correctly map values when there are two-factor methods", async () => {
    const methods = [
      { id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
      { id: "2", method: "sms", email: "", mobilePhone: "1234567890" },
    ];

    mockedFusionAuthClient.retrieveUserByEmail.mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods,
          },
        },
      },
    });

    const expected = [
      { methodId: "1", method: "email", value: "test1@example.com" },
      { methodId: "2", method: "sms", value: "1234567890" },
    ];

    const result = await getTwoFactorMethods("test@example.com");
    expect(result).toEqual(expected);
  });
});
