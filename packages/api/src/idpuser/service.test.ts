import { fusionAuthClient } from "../fusionauth";

jest.mock("../fusionauth");

describe("/idpuser", () => {
  beforeEach(async () => {
    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [],
          },
        },
      },
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test("should return an array with the length equal to 1 is the user has one multi factor method enabled", async () => {
    fusionAuthClient.retrieveUserByEmail = jest.fn().mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                value: "test@example.com",
              },
            ],
          },
        },
      },
    });

    const response = await fusionAuthClient.retrieveUserByEmail(
      "email@example.com"
    );
    const { methods } = response.response.user.twoFactor;

    expect(methods.length).toEqual(1);
  });

  test("should return an array with the length equal to 2 is the user has both multi factor methods enabled", async () => {
    fusionAuthClient.retrieveUserByEmail = jest.fn().mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                value: "test@example.com",
              },
              {
                id: "5678",
                method: "sms",
                value: "+1234567890",
              },
            ],
          },
        },
      },
    });

    const response = await fusionAuthClient.retrieveUserByEmail(
      "email@example.com"
    );
    const { methods } = response.response.user.twoFactor;

    expect(methods.length).toEqual(2);
  });
});
