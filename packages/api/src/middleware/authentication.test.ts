import type { IntrospectResponse } from "@fusionauth/typescript-client";
import ClientResponse from "@fusionauth/typescript-client/build/src/ClientResponse";
import type { Request, Response } from "express";
import { verifyUserAuthentication } from "./authentication";
import { fusionAuthClient } from "../fusionauth";

jest.mock("../fusionauth");

const successfulIntrospectionResponse =
  new ClientResponse<IntrospectResponse>();
successfulIntrospectionResponse.statusCode = 200;
successfulIntrospectionResponse.response = {
  active: true,
  email: "test@permanent.org",
  wasSuccessful: (): boolean => true,
};

const failedIntrospectionResponse = new ClientResponse<IntrospectResponse>();
failedIntrospectionResponse.statusCode = 200;
failedIntrospectionResponse.response = {
  wasSuccessful: (): boolean => false,
  exception: { message: "Out of Cheese Error. Redo From Start" },
};

const expiredTokenIntrospectionResponse =
  new ClientResponse<IntrospectResponse>();
expiredTokenIntrospectionResponse.statusCode = 200;
expiredTokenIntrospectionResponse.response = {
  active: false,
  wasSuccessful: (): boolean => true,
};

const missingEmailIntrospectionResponse =
  new ClientResponse<IntrospectResponse>();
missingEmailIntrospectionResponse.statusCode = 200;
missingEmailIntrospectionResponse.response = {
  active: true,
  wasSuccessful: (): boolean => true,
};

test("should add the email to the request body if the token is valid", async () => {
  const request = {
    body: {},
    get: (_: string) => "Bearer test",
  } as Request<unknown, unknown, { emailFromAuthToken?: string }>;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => successfulIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, () => {
    expect(request.body.emailFromAuthToken).toBe("test@permanent.org");
  });
});

test("should throw unauthorized if authorization header is missing", async () => {
  const request = {
    body: {},
    get: (_: string): string | null => null,
  } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => successfulIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});

test("should throw unauthorized if authorization header has the wrong number of words", async () => {
  const request = {
    body: {},
    get: (_: string) => "test",
  } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => successfulIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});

test("should throw unauthorized if authorization header doesn't start with Bearer", async () => {
  const request = {
    body: {},
    get: (_: string) => "test test",
  } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => successfulIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});

test("should throw unauthorized if token validation call fails", async () => {
  const request = { body: {}, get: (_: string) => "Bearer test" } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => failedIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});

test("should throw unauthorized if token is expired", async () => {
  const request = { body: {}, get: (_: string) => "Bearer test" } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => expiredTokenIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});

test("should throw unauthorized if token doesn't include an email", async () => {
  const request = { body: {}, get: (_: string) => "Bearer test" } as Request;
  jest
    .spyOn(fusionAuthClient, "introspectAccessToken")
    .mockImplementation(async () => missingEmailIntrospectionResponse);
  verifyUserAuthentication(request, {} as Response, (err) => {
    expect((err as { statusCode: number }).statusCode).toBe(401);
  });
});
