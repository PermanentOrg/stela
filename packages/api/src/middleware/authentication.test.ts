import type { Request, Response } from "express";
import {
  extractUserEmailFromAuthToken,
  verifyUserAuthentication,
  verifyAdminAuthentication,
  verifyUserOrAdminAuthentication,
} from "./authentication";
import { fusionAuthClient } from "../fusionauth";

jest.mock("../fusionauth");

const testEmail = "test@permanent.org";
const testSubject = "b2a6787c-f255-465a-8eb0-1583004d4a4f";

const successfulIntrospectionResponse = {
  statusCode: 200,
  response: {
    active: true as const,
    email: testEmail,
    sub: testSubject,
    applicationId: "de3aba1d-314a-4aad-8ccd-192b78979678",
    aud: "038b2813-afe9-4c0b-b175-6dfe1c8863cc",
    auth_time: 1709591001,
    authenticationType: "PASSWORD",
    email_verified: true,
    exp: 1709594601,
    iat: 1709591001,
    iss: "https://permanent-fake-test-issuer.io/",
    jti: "38d2e43e-78f6-41c8-a321-5e9094c6d9d0",
    roles: [],
    tid: "93dd3515-b384-44d7-81bb-2cbf85e01c13",
  },
  exception: {},
  wasSuccessful: (): boolean => true,
};

const failedIntrospectionResponse = {
  statusCode: 200,
  wasSuccessful: (): boolean => false,
  response: {
    active: false as const,
  },
  exception: {
    name: "Out of Cheese",
    message: "Out of Cheese Error. Redo From Start",
  },
};

const expiredTokenIntrospectionResponse = {
  statusCode: 200,
  response: {
    active: false as const,
  },
  exception: {},
  wasSuccessful: (): boolean => true,
};

const missingEmailIntrospectionResponse = {
  statusCode: 200,
  response: {
    active: true as const,
    email: "",
    sub: testSubject,
    applicationId: "de3aba1d-314a-4aad-8ccd-192b78979678",
    aud: "038b2813-afe9-4c0b-b175-6dfe1c8863cc",
    auth_time: 1709591001,
    authenticationType: "PASSWORD",
    email_verified: true,
    exp: 1709594601,
    iat: 1709591001,
    iss: "https://permanent-fake-test-issuer.io/",
    jti: "38d2e43e-78f6-41c8-a321-5e9094c6d9d0",
    roles: [],
    tid: "93dd3515-b384-44d7-81bb-2cbf85e01c13",
  },
  exception: {},
  wasSuccessful: (): boolean => true,
};

describe("verifyUserAuthentication", () => {
  test("should add the email to the request body if the token is valid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, () => {});

    expect(request.body.emailFromAuthToken).toBe(testEmail);
  });

  test("should throw unauthorized if authorization header is missing", async () => {
    const request = {
      body: {},
      get: (_: string): string | null => null,
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  test("should throw unauthorized if authorization header has the wrong number of words", async () => {
    const request = {
      body: {},
      get: (_: string) => "test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  test("should throw unauthorized if authorization header doesn't start with Bearer", async () => {
    const request = {
      body: {},
      get: (_: string) => "test test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  test("should throw unauthorized if token validation call fails", async () => {
    const request = { body: {}, get: (_: string) => "Bearer test" } as Request<
      unknown,
      unknown,
      { emailFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => failedIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  test("should throw unauthorized if token is expired", async () => {
    const request = { body: {}, get: (_: string) => "Bearer test" } as Request<
      unknown,
      unknown,
      { emailFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => expiredTokenIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });

  test("should throw unauthorized if token doesn't include an email", async () => {
    const request = { body: {}, get: (_: string) => "Bearer test" } as Request<
      unknown,
      unknown,
      { emailFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => missingEmailIntrospectionResponse);
    await verifyUserAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });
});

describe("verifyAdminAuthentication", () => {
  test("should add the email to the request body if the token is valid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyAdminAuthentication(request, {} as Response, () => {});

    expect(request.body.emailFromAuthToken).toBe(testEmail);
  });

  test("should throw unauthorized if authorization header is missing", async () => {
    const request = {
      body: {},
      get: (_: string): string | null => null,
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);
    await verifyAdminAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });
});

describe("verifyUserOrAdminAuthentication", () => {
  test("should add email to the request body if user token is valid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<
      unknown,
      unknown,
      { userSubjectFromAuthToken?: string; adminSubjectFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => successfulIntrospectionResponse);

    await verifyUserOrAdminAuthentication(request, {} as Response, () => {});
    expect(request.body.userSubjectFromAuthToken).toBe(testSubject);
  });

  test("should add email to the request body if admin token is valid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<
      unknown,
      unknown,
      { userSubjectFromAuthToken?: string; adminSubjectFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementationOnce(async () => expiredTokenIntrospectionResponse)
      .mockImplementationOnce(async () => successfulIntrospectionResponse);

    await verifyUserOrAdminAuthentication(request, {} as Response, () => {});
    expect(request.body.adminSubjectFromAuthToken).toBe(testSubject);
  });

  test("should throw unauthorized if both tokens are invalid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<
      unknown,
      unknown,
      { userSubjectFromAuthToken?: string; adminSubjectFromAuthToken?: string }
    >;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementation(async () => expiredTokenIntrospectionResponse);

    await verifyUserOrAdminAuthentication(request, {} as Response, (err) => {
      expect((err as { statusCode: number }).statusCode).toBe(401);
    });
  });
});

describe("extractUserEmailFromAuthToken", () => {
  test("request body will have email if there was an auth token", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementationOnce(async () => successfulIntrospectionResponse);
    await extractUserEmailFromAuthToken(request, {} as Response, () => {});
    expect(request.body.emailFromAuthToken).toBe(testEmail);
  });

  test("Request body has undefined emailFromAuthToken if there was no auth token", async () => {
    const request = {
      body: {},
      get: (_: string) => "",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    await extractUserEmailFromAuthToken(request, {} as Response, () => {});
    expect(request.body.emailFromAuthToken).toBeUndefined();
  });

  test("Request body has undefined emailFromAuthToken if auth token is invalid", async () => {
    const request = {
      body: {},
      get: (_: string) => "Bearer test",
    } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
    jest
      .spyOn(fusionAuthClient, "introspectAccessToken")
      .mockImplementationOnce(async () => failedIntrospectionResponse);
    await extractUserEmailFromAuthToken(request, {} as Response, () => {});
    expect(request.body.emailFromAuthToken).toBeUndefined();
  });
});
