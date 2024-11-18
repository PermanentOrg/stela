import { validatePatchRecordRequest } from "./validators";

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
