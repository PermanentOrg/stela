import { validateCreateDirectiveRequest } from "./validators";

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
        trigger: "admin",
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
        trigger: "admin",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
