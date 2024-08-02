import { validateBodyFromAuthentication } from "./shared";

describe("validateBodyFromAuthentication", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "test",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({ userSubjectFromAuthToken: "test" });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is the wrong type", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: 1,
        userSubjectFromAuthToken: "test",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is an invalid value", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: "not_an_email",
        userSubjectFromAuthToken: "test",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if userSubjectFromAuthToken is missing", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: "test@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if userSubjectFromAuthToken is the wrong type", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
