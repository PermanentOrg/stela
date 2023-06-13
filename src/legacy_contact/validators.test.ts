import {
  validateCreateLegacyContactRequest,
  validateUpdateLegacyContactParams,
  validateUpdateLegacyContactRequest,
} from "./validators";

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
  test("should raise an error if email is the active account's", () => {
    let error = null;
    try {
      validateCreateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "test@permanent.org",
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

describe("validateUpdateLegacyContactRequest", () => {
  test("should find no errors in a fully populated request", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "contact@permanent.org",
        name: "John Rando",
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
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error when emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when emailFromAuthToken is wrong type", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when emailFromAuthToken is wrong format", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "not_an_email",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when email is wrong type", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when email is wrong format", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "not_an_email",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when email is the active account's", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "test@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error when name is wrong type", () => {
    let error = null;
    try {
      validateUpdateLegacyContactRequest({
        emailFromAuthToken: "test@permanent.org",
        email: "contact@permanent.org",
        name: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateUpdateLegacyContactParams", () => {
  test("should find no errors in valid parameters", () => {
    let error = null;
    try {
      validateUpdateLegacyContactParams({
        legacyContactId: "0cb0738c-5607-42d0-8014-8666a8d6ba13",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if legacyContactId is missing", () => {
    let error = null;
    try {
      validateUpdateLegacyContactParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if legacyContactId is wrong type", () => {
    let error = null;
    try {
      validateUpdateLegacyContactParams({
        legacyContactId: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if legacyContactId is wrong format", () => {
    let error = null;
    try {
      validateUpdateLegacyContactParams({
        legacyContactId: "not_a_uuid",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
