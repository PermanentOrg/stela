import {
  validateLeaveArchiveParams,
  validateLeaveArchiveRequest,
  validateUpdateTagsRequest,
} from "./validators";

describe.skip("validateUpdateTagsRequest", () => {
  test("should find no errors in a valid request", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", "tag4"],
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
      validateUpdateTagsRequest({
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", "tag4"],
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
      validateUpdateTagsRequest({
        emailFromAuthToken: 1,
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", "tag4"],
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
      validateUpdateTagsRequest({
        emailFromAuthToken: "not_an_email",
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", "tag4"],
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if addTags is not an array", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
        addTags: "tag1, tag2",
        removeTags: ["tag3", "tag4"],
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if addTags has members of the wrong type", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
        addTags: ["tag1", 2],
        removeTags: ["tag3", "tag4"],
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if removeTags is not an array", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
        addTags: ["tag1", "tag2"],
        removeTags: "tag3, tag4",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if removeTags has members of the wrong type", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
        addTags: ["tag1", "tag2"],
        removeTags: ["tag3", 4],
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
  test("should raise an error if addTags and removeTags are missing", () => {
    let error = null;
    try {
      validateUpdateTagsRequest({
        emailFromAuthToken: "test@permanent.org",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe.skip("validateLeaveArchiveParams", () => {
  test("should find no errors in valid parameters", () => {
    let error = null;
    try {
      validateLeaveArchiveParams({
        archiveId: "123",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if archiveId is missing", () => {
    let error = null;
    try {
      validateLeaveArchiveParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if archiveId is wrong type", () => {
    let error = null;
    try {
      validateLeaveArchiveParams({
        archiveId: 123,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if archiveId string contains non-numeric characters", () => {
    let error = null;
    try {
      validateLeaveArchiveParams({
        archiveId: 123,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if archiveId string begins with a 0", () => {
    let error = null;
    try {
      validateLeaveArchiveParams({
        archiveId: "0123",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});

describe("validateLeaveArchiveRequest", () => {
  test("should find no errors in valid parameters", () => {
    let error = null;
    try {
      validateLeaveArchiveRequest({
        ip: "127.0.0.1",
        emailFromAuthToken: "test@test.com",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).toBeNull();
    }
  });

  test("should error if 'ip' is missing", () => {
    let error = null;
    try {
      validateLeaveArchiveRequest({
        emailFromAuthToken: "test@test.com",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if 'emailFromAuthToken' is missing", () => {
    let error = null;
    try {
      validateLeaveArchiveRequest({
        ip: "127.0.0.1",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if 'ip' is not the right format", () => {
    let error = null;
    try {
      validateLeaveArchiveRequest({
        ip: "1.2.3",
        emailFromAuthToken: "test@test.com",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if 'emailFromAuthToken' is not the right format", () => {
    let error = null;
    try {
      validateLeaveArchiveRequest({
        ip: "127.0.0.1",
        emailFromAuthToken: "not_an_email",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
