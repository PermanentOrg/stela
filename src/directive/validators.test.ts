import {
  validateCreateDirectiveRequest,
  validateTriggerAdminDirectivesParams,
  validateGetDirectivesByArchiveIdParams,
  validateBodyFromAuthentication,
} from "./validators";

describe("validateCreateDirectiveRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if archiveId is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if stewardAccountId is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if type is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if trigger.type is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {},
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if trigger is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if archiveId value is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: -1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if stewardAccountId value is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: -1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if archiveId type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "one",
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if stewardAccountId type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: "one",
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if type type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: 1,
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if note type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        note: 1,
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if trigger.type type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: 1,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if trigger type is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: "admin",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if emailFromAuthToken is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "not_an_email",
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
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
      validateCreateDirectiveRequest({
        emailFromAuthToken: 1,
        archiveId: 1,
        stewardAccountId: 1,
        type: "transfer",
        trigger: {
          type: "admin",
        },
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateTriggerAdminDirectivesParams", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateTriggerAdminDirectivesParams({
        accountId: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if accountId is missing", () => {
    let error = null;
    try {
      validateTriggerAdminDirectivesParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if accountId is the wrong type", () => {
    let error = null;
    try {
      validateTriggerAdminDirectivesParams({
        accountId: "one",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if accountId is an invalid value", () => {
    let error = null;
    try {
      validateTriggerAdminDirectivesParams({
        accountId: 0,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateGetDirectivesByArchiveIdParams", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateGetDirectivesByArchiveIdParams({
        archiveId: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if archiveId is missing", () => {
    let error = null;
    try {
      validateGetDirectivesByArchiveIdParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if archiveId is the wrong type", () => {
    let error = null;
    try {
      validateGetDirectivesByArchiveIdParams({
        archiveId: "one",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if archiveId is an invalid value", () => {
    let error = null;
    try {
      validateGetDirectivesByArchiveIdParams({
        archiveId: 0,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateBodyFromAuthentication", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateBodyFromAuthentication({
        emailFromAuthToken: "test@permanent.org",
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
      validateBodyFromAuthentication({});
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
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
