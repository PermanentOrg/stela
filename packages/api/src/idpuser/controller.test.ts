import request from "supertest";
import createError from "http-errors";
import type { NextFunction, Request } from "express";
import { app } from "../app";
import { db } from "../database";
import { verifyUserAuthentication } from "../middleware";
import { fusionAuthClient } from "../fusionauth";
import type {
  TwoFactorRequestResponse,
  SendEnableCodeRequest,
  CreateTwoFactorMethodRequest,
  SendDisableCodeRequest,
  DisableTwoFactorRequest,
} from "./models";

interface TwoFactorRequest {
  emailFromAuthToken: string;
  userSubjectFromAuthToken: string;
}

jest.mock("../database");
jest.mock("node-fetch", () => jest.fn());
jest.mock("../middleware");
jest.mock("../fusionauth");

describe("/idpuser", () => {
  const agent = request(app);
  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as TwoFactorRequest).emailFromAuthToken =
          "test@permanent.org";
        (req.body as TwoFactorRequest).userSubjectFromAuthToken =
          "test_subject";
        next();
      }
    );

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [],
          },
        },
      },
      wasSuccessful: () => true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  test("expect a non-404 response", async () => {
    await agent.get("/api/v2/idpuser").expect(200);
  });

  test("should return invalid request status if the value from the auth token is not a valid email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as TwoFactorRequest).emailFromAuthToken = "not_an_email";
        next();
      }
    );
    await agent.get("/api/v2/idpuser").expect(400);
  });

  test("should return invalid request status if there is no email in the auth token", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent.get("/api/v2/idpuser").expect(400);
  });

  test("should return an array", async () => {
    const response = await agent.get("/api/v2/idpuser");
    expect(response.body).toBeInstanceOf(Array);
  });

  test("should return an array with the length equal to 1 if the user has one multi factor method enabled", async () => {
    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods: [
              {
                id: "1234",
                method: "email",
                email: "test@example.com",
                mobilePhone: "",
              },
            ],
          },
        },
      },
      wasSuccessful: () => true,
    });

    const response = await agent.get("/api/v2/idpuser");

    expect((response.body as TwoFactorRequestResponse[]).length).toEqual(1);
  });

  test("should return an array with the length equal to 2 if the user has both multi factor methods enabled", async () => {
    const methods = [
      { id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
      { id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
    ];

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods,
          },
        },
      },
      wasSuccessful: () => true,
    });

    const response = await agent.get("/api/v2/idpuser");

    expect((response.body as TwoFactorRequestResponse[]).length).toEqual(2);
  });

  test("should return a 500 status if getTwoFactorMethods throws an error", async () => {
    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      wasSuccessful: () => false,
      exception: { code: "500", message: "test_message" },
    });

    const response = await agent.get("/api/v2/idpuser");
    expect(response.status).toBe(500);
  });

  test("should correctly map values when there are two-factor methods", async () => {
    const methods = [
      { id: "1", method: "email", email: "test1@example.com", mobilePhone: "" },
      { id: "2", method: "sms", mobilePhone: "1234567890", email: "" },
    ];

    (fusionAuthClient.retrieveUserByEmail as jest.Mock).mockResolvedValue({
      response: {
        user: {
          twoFactor: {
            methods,
          },
        },
      },
      wasSuccessful: () => true,
    });

    const expected = [
      { methodId: "1", method: "email", value: "test1@example.com" },
      { methodId: "2", method: "sms", value: "1234567890" },
    ];

    const response = await agent.get("/api/v2/idpuser");

    expect(response.body).toEqual(expected);
  });
});

describe("idpuser/send-enable-code", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE account CASCADE;");
  };

  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as SendEnableCodeRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );

    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => true,
    });

    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
  });

  test("should return a 200 status if the request is successful", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(200);
  });

  test("should return a 401 status if the request is not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(createError(401, "Unauthorized"));
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(401);
  });

  test("should return a 400 status if emailFromAuthToken is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if emailFromAuthToken is not an email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, _, next: NextFunction) => {
        (req.body as SendEnableCodeRequest).emailFromAuthToken = "not_an_email";
        next();
      }
    );
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if method is missing", async () => {
    await agent.post("/api/v2/idpuser/send-enable-code").expect(400);
  });

  test("should return a 400 status if method is invalid", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "invalid", value: "test@permanent.org" })
      .expect(400);
  });

  test("should return a 400 status if value is missing", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email" })
      .expect(400);
  });

  test("should return a 400 status if method is email and value is not an email", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "not_an_email" })
      .expect(400);
  });

  test("should call the fusionauth client to send the code", async () => {
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(200);
    expect(
      fusionAuthClient.sendTwoFactorCodeForEnableDisable
    ).toHaveBeenCalled();
  });

  test("should return a 404 status if the user doesn't exist in the database", async () => {
    await db.query("TRUNCATE account CASCADE;");
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(404);
  });

  test("should return a 500 status if the fusionauth client throws an error", async () => {
    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => false,
      exception: { code: "500", message: "test_message" },
    } as unknown as ReturnType<typeof fusionAuthClient.sendTwoFactorCodeForEnableDisable>);
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(500);
  });

  test("should return a 500 status if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("test_error"));
    await agent
      .post("/api/v2/idpuser/send-enable-code")
      .send({ method: "email", value: "test@permanent.org" })
      .expect(500);
  });
});

describe("POST /idpuser/enable-two-factor", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE account CASCADE;");
  };

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    jest.resetAllMocks();
    await loadFixtures();
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreateTwoFactorMethodRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
  });

  test("should return a 401 status if the caller is not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, ___: NextFunction) => {
        throw new createError.Unauthorized("Invalid token");
      }
    );
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "sms", value: "000-000-0000" })
      .expect(401);
  });

  test("should return a 400 status if the email from the auth token is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "sms", value: "000-000-0000" })
      .expect(400);
  });

  test("should return a 400 status if the email from the auth token is not an email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as CreateTwoFactorMethodRequest).emailFromAuthToken =
          "not_an_email";
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "sms", value: "000-000-0000" })
      .expect(400);
  });

  test("should return a 400 status if the code is missing", async () => {
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ method: "sms", value: "000-000-0000" })
      .expect(400);
  });

  test("should return a 400 status if the method is missing", async () => {
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", value: "000-000-0000" })
      .expect(400);
  });

  test("should return a 400 status if the method is invalid", async () => {
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "invalid", value: "000-000-0000" })
      .expect(400);
  });

  test("should return a 400 status if value is missing", async () => {
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "email" })
      .expect(400);
  });

  test("should return a 400 status if the method is email and value is not an email", async () => {
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "email", value: "not_an_email" })
      .expect(400);
  });

  test("should call fusionAuth to create the MFA method", async () => {
    (fusionAuthClient.enableTwoFactor as jest.Mock).mockResolvedValue({
      wasSuccessful: () => true,
    } as unknown as ReturnType<typeof fusionAuthClient.enableTwoFactor>);
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({
        code: "test_code",
        method: "email",
        value: "test@permanent.org",
      })
      .expect(200);
    expect(fusionAuthClient.enableTwoFactor).toHaveBeenCalled();
  });

  test("should return status 404 if the user isn't in the database", async () => {
    await db.query("TRUNCATE account CASCADE;");
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({
        code: "test_code",
        method: "email",
        value: "test@permanent.org",
      })
      .expect(404);
  });

  test("should return status 500 if the fusionAuth call fails", async () => {
    (fusionAuthClient.enableTwoFactor as jest.Mock).mockResolvedValue({
      wasSucccessful: () => false,
      exception: { code: "500", message: "test_message" },
    } as unknown as ReturnType<typeof fusionAuthClient.enableTwoFactor>);
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({ code: "test_code", method: "sms", value: "000-000-0000" })
      .expect(500);
  });

  test("should return status 500 if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValueOnce(new Error("Database error"));
    await agent
      .post("/api/v2/idpuser/enable-two-factor")
      .send({
        code: "test_code",
        method: "email",
        value: "test@permanent.org",
      })
      .expect(500);
  });
});

describe("idpuser/send-disable-code", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE account CASCADE;");
  };

  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as SendDisableCodeRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );

    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => true,
    });

    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
  });

  test("should return a 200 status if the request is successful", async () => {
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(200);
  });

  test("should return a 401 status if the request not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(createError(401, "Unauthorized"));
      }
    );
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(401);
  });

  test("should return a 400 status if emailFromAuthToken is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(400);
  });

  test("should return a 400 status if emailFromAuthToken is not an email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, _, next: NextFunction) => {
        (req.body as SendDisableCodeRequest).emailFromAuthToken =
          "not_an_email";
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(400);
  });

  test("should return a 400 status if methodId is missing", async () => {
    await agent.post("/api/v2/idpuser/send-disable-code").expect(400);
  });

  test("should call the fusionauth client to send the code", async () => {
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(200);
    expect(
      fusionAuthClient.sendTwoFactorCodeForEnableDisable
    ).toHaveBeenCalled();
  });

  test("should return a 404 status if the user doesn't exist in the database", async () => {
    await db.query("TRUNCATE account CASCADE;");
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(404);
  });

  test("should return a 500 status if the fusionauth client throws an error", async () => {
    (
      fusionAuthClient.sendTwoFactorCodeForEnableDisable as jest.Mock
    ).mockResolvedValue({
      wasSuccessful: () => false,
      exception: { code: "500", message: "test_message" },
    } as unknown as ReturnType<typeof fusionAuthClient.sendTwoFactorCodeForEnableDisable>);
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(500);
  });

  test("should return a 500 status if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValue(new Error("test_error"));
    await agent
      .post("/api/v2/idpuser/send-disable-code")
      .send({ methodId: "test_method_id" })
      .expect(500);
  });
});

describe("/idpuser/disable-two-factor", () => {
  const agent = request(app);

  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query("TRUNCATE account CASCADE;");
  };

  beforeEach(async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as DisableTwoFactorRequest).emailFromAuthToken =
          "test@permanent.org";
        next();
      }
    );

    (fusionAuthClient.disableTwoFactor as jest.Mock).mockResolvedValue({
      wasSuccessful: () => true,
    });

    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
  });

  test("should return 200 status if the request is successful", async () => {
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(200);
  });

  test("should return 401 status if the request is not authenticated", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next(createError.Unauthorized("Invalid token"));
      }
    );
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(401);
  });

  test("should return 400 status if emailFromAuthToken is missing", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (_: Request, __, next: NextFunction) => {
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(400);
  });

  test("should return 400 status if emailFromAuthToken is not an email", async () => {
    (verifyUserAuthentication as jest.Mock).mockImplementation(
      (req: Request, __, next: NextFunction) => {
        (req.body as DisableTwoFactorRequest).emailFromAuthToken =
          "not_an_email";
        next();
      }
    );
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(400);
  });

  test("should return 400 status if methodId is missing", async () => {
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ code: "test_code" })
      .expect(400);
  });

  test("should return 400 status if code is missing", async () => {
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id" })
      .expect(400);
  });

  test("should call the fusionauth client to disable the two factor method", async () => {
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(200);
    expect(fusionAuthClient.disableTwoFactor).toHaveBeenCalled();
  });

  test("should return status 404 if the user isn't in the database", async () => {
    await db.query("TRUNCATE account CASCADE;");
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(404);
  });

  test("should return status 500 if the fusionAuth call fails", async () => {
    (fusionAuthClient.disableTwoFactor as jest.Mock).mockResolvedValue({
      wasSucccessful: () => false,
      exception: { code: "500", message: "test_message" },
    } as unknown as ReturnType<typeof fusionAuthClient.disableTwoFactor>);
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(500);
  });

  test("should return status 500 if the database call fails", async () => {
    jest.spyOn(db, "sql").mockRejectedValueOnce(new Error("Database error"));
    await agent
      .post("/api/v2/idpuser/disable-two-factor")
      .send({ methodId: "test_method_id", code: "test_code" })
      .expect(500);
  });
});
