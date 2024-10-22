import { validateCreateFeatureFlagRequest } from "./validators";

describe("validateCreateFeatureFlagRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateCreateFeatureFlagRequest({
        emailFromAuthToken: "user@example.com",
        adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        name: "test-feature-flag",
        description: "feature flag description",
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
      validateCreateFeatureFlagRequest({
        emailFromAuthToken: "user@example.com",
        adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        name: "test-feature-flag",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if name is missing", () => {
    let error = null;
    try {
      validateCreateFeatureFlagRequest({
        emailFromAuthToken: "user@example.com",
        adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        description: "feature flag description",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if name is wrong type", () => {
    let error = null;
    try {
      validateCreateFeatureFlagRequest({
        emailFromAuthToken: "user@example.com",
        adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        name: 1,
        description: "feature flag description",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should raise an error if description is wrong type", () => {
    let error = null;
    try {
      validateCreateFeatureFlagRequest({
        emailFromAuthToken: "user@example.com",
        adminSubjectFromAuthToken: "5c3473b6-cf2e-4c55-a80e-8db51d1bc5fd",
        name: "name",
        description: 123,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
