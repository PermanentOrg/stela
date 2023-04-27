import { validateCreateLegacyContactRequest } from "./validators";

describe("validateCreateLegacyContactRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "test+1@permanent.org",
        name: "John Rando",
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
      validateCreateLegacyContactRequest({
        email: "test+1@permanent.org",
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is wrong type", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: 1,
        email: "test+1@permanent.org",
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is wrong format", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "not_an_email",
        email: "test+1@permanent.org",
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if email is missing", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if email is wrong type", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: 1,
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if email is wrong format", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "not_an_email",
        name: "John Rando",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if name is missing", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "test+1@permanent.org",
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
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "test+1@permanent.org",
        name: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
