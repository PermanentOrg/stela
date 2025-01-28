import {
  validatePatchRecordRequest,
  validateGetRecordRequestBody,
} from "./validators";

describe("validatePatchRecordRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validatePatchRecordRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        locationId: 123,
        description: "description",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should not raise an error when optional fields are missing", () => {
    let error = null;
    try {
      validatePatchRecordRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        locationId: 123,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should not raise an error when fields are null", () => {
    let error = null;
    try {
      validatePatchRecordRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        locationId: null,
        description: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should raise an error if locationId is wrong type", () => {
    let error = null;
    try {
      validatePatchRecordRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        locationId: true,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateGetRecordRequestBody", () => {
  test("should find no error if request body is empty", () => {
    let error = null;
    try {
      validateGetRecordRequestBody({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should accept a request with an email and a share token", () => {
    let error = null;
    try {
      validateGetRecordRequestBody({
        emailFromAuthToken: "test@permanent.org",
        shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if emailFromAuthToken is not a string", () => {
    let error = null;
    try {
      validateGetRecordRequestBody({
        emailFromAuthToken: 0,
        shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if emailFromAuthToken is not an email", () => {
    let error = null;
    try {
      validateGetRecordRequestBody({
        emailFromAuthToken: "not_an_email",
        shareToken: "45e049b8-82c4-4d19-97d5-ff240cf95d73",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if shareToken is not a string", () => {
    let error = null;
    try {
      validateGetRecordRequestBody({
        emailFromAuthToken: "test@permanent.org",
        shareToken: 0,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
