import { validatePatchFolderRequest } from "./validators";

describe("validatePatchFolderRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validatePatchFolderRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        displayDate: null,
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
      validatePatchFolderRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
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
      validatePatchFolderRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        displayDate: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should raise an error if displayDate is wrong type", () => {
    let error = null;
    try {
      validatePatchFolderRequest({
        emailFromAuthToken: "user@example.com",
        userSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        displayDate: true,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
