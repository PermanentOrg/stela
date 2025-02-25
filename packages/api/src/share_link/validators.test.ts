import {
  validateCreateShareLinkRequest,
  validateUpdateShareLinkRequest,
} from "./validators";

describe("validateCreateShareLinkRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should throw an error if emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if userSubjectFromAuthToken is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if itemId is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if itemId is the wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: 1,
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if itemType is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if itemType is wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: 1,
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should throw an error if itemType is invalid value", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "collection",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should not error if permissionsLevel is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if permissionsLevel is the wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: 1,
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if permissionsLevel is an invalid value", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "admin",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should not error if accessRestrictions is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if accessRestrictions is the wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: 1,
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if accessRestrictions is an invalid value", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "all",
        maxUses: 100,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should not error if maxUses is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "none",
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if maxUses is the wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: "one",
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if maxUses is less than one", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 0,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if maxUses is not an integer", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 1.5,
        expirationTimestamp: new Date(
          new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should not error if expirationTimestamp is missing", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if expirationTimestamp is the wrong type", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if expirationTimestamp is the wrong format", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        maxUses: 100,
        expirationTimestamp: "01/01/01",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if accessRestrictions is none and maxUses is set", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        accessRestrictions: "none",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if accessRestrictions is unset and maxUses is set", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "viewer",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if accessRestrictions is none and permissionsLevel is not 'viewer'", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        accessRestrictions: "none",
        permissionsLevel: "owner",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if accessRestrictions is not set and permissionsLevel is not 'viewer'", () => {
    let error = null;
    try {
      validateCreateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        itemId: "315aedc2-67d5-4144-9f0d-ee547d98af9c",
        itemType: "record",
        permissionsLevel: "owner",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateUpdateShareLinkRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        expirationTimestamp: "2030-12-31",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        expirationTimestamp: "2030-12-31",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if userSubjectFromAuthToken is missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        permissionsLevel: "viewer",
        accessRestrictions: "account",
        expirationTimestamp: "2030-12-31",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if all fields are missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if permissionsLevel is not a string", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        permissionsLevel: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if permissionsLevel is an invalid value", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        permissionsLevel: "admin",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if permissionsLevel is null", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        permissionsLevel: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should not error if permissionsLevel is missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if accessRestrictions is not a string", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        accessRestrictions: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if accessRestrictions is an invalid value", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        accessRestrictions: "all",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if accessRestrictions is null", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        accessRestrictions: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should not error if accessRestrictions is missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if expirationTimestamp is not a string", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        expirationTimestamp: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if expirationTimestamp is the wrong format", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        expirationTimestamp: "not_a_date",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should accept expirationTimestamp = null", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        expirationTimestamp: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should not error if expirationTimestamp missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if maxUses is not a number", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: "one",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if maxUses is not an integer", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: 2.5,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if maxUses is less than one", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: 0,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should accept maxUses=null", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        maxUses: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should not error if maxUses is missing", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        expirationTimestamp: null,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should error if request tries to create an unrestricted link with limited uses", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        accessRestrictions: "none",
        maxUses: 100,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should error if request tries to create an unrestricted link with permissions higher than 'viewer'", () => {
    let error = null;
    try {
      validateUpdateShareLinkRequest({
        emailFromAuthToken: "test@permanent.org",
        userSubjectFromAuthToken: "1129f5a8-7b9c-4211-ae59-dd83faad2455",
        accessRestrictions: "none",
        permissionsLevel: "owner",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
