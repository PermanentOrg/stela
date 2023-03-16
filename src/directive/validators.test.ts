import {
  validateCreateDirectiveRequest,
  validateTriggerAdminDirectivesParams,
  validateGetDirectivesByArchiveIdParams,
  validateBodyFromAuthentication,
  validateUpdateDirectiveParams,
  validateUpdateDirectiveRequest,
} from "./validators";

describe("validateCreateDirectiveRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if stewardEmail is missing", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
        type: "transfer",
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
        archiveId: 1,
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if stewardEmail value is invalid", () => {
    let error = null;
    try {
      validateCreateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        archiveId: "1",
        stewardEmail: "test+1",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        type: "transfer",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        archiveId: "1",
        stewardEmail: "test+1@permanent.org",
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
        stewardEmail: "test+1@permanent.org",
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
        accountId: "1",
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
        accountId: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateUpdateDirectiveParams", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateUpdateDirectiveParams({
        directiveId: "9b729043-fa60-49e7-87b2-d007a9b82a2e",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });
  test("should raise an error if directiveId is missing", () => {
    let error = null;
    try {
      validateUpdateDirectiveParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if directiveId is the wrong type", () => {
    let error = null;
    try {
      validateUpdateDirectiveParams({
        directiveId: 1,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if directiveId is an invalid value", () => {
    let error = null;
    try {
      validateUpdateDirectiveParams({
        directiveId: "not_a_uuid",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateUpdateDirectiveRequest", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
        type: "transfer",
        note: "note",
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
  test("should raise an error if emailFromAuthToken is missing", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        stewardEmail: "test+1@permanent.org",
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
      validateUpdateDirectiveRequest({
        emailFromAuthToken: 1,
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if emailFromAuthToken is an invalid value", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "not_an_email",
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if stewardEmail is wrong type", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: 1,
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
  test("should raise an error if stewardEmail is an invalid value", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "not_an_email",
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
  test("should raise an error if stewardEmail appears when type is set and not transfer", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
        type: "delete",
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
  test("should raise an error if type is wrong data type", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if note is wrong data type", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
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
  test("should raise an error if trigger is wrong data type", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
        type: "transfer",
        note: "note",
        trigger: "admin",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if trigger type is wrong data type", () => {
    let error = null;
    try {
      validateUpdateDirectiveRequest({
        emailFromAuthToken: "test@permanent.org",
        stewardEmail: "test+1@permanent.org",
        type: "transfer",
        note: "note",
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
});

describe("validateGetDirectivesByArchiveIdParams", () => {
  test("should find no errors in valid parameter set", () => {
    let error = null;
    try {
      validateGetDirectivesByArchiveIdParams({
        archiveId: "1",
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
        archiveId: 1,
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
