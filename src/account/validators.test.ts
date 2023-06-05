import { validateUpdateTagsRequest } from "./validators";

describe("validateUpdateTagsRequest", () => {
  test("should find not errors in a valid request", () => {
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
