import { validateRecalculateFolderThumbnailsRequest } from "./validators";

describe("validateRecalculateFolderThumbnailsRequest", () => {
  test("should not error if the request is valid", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "2023-07-30",
        endTimestamp: "2023-07-31",
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
      validateRecalculateFolderThumbnailsRequest({
        beginTimestamp: "2023-07-30",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if emailFromAuthToken is wrong type", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: 123,
        beginTimestamp: "2023-07-30",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if emailFromAuthToken is wrong format", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "not_an_email",
        beginTimestamp: "2023-07-30",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if beginTimestamp is missing", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if beginTimestamp is wrong type", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "not_a_date",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if beginTimestamp is wrong format", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "07/31/23",
        endTimestamp: "2023-07-31",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if endTimestamp is missing", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "2023-07-30",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if endTimestamp is wrong type", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "2023-07-30",
        endTimestamp: "not_a_date",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if endTimestamp is wrong format", () => {
    let error = null;
    try {
      validateRecalculateFolderThumbnailsRequest({
        emailFromAuthToken: "test@permanent.org",
        beginTimestamp: "2023-07-30",
        endTimestamp: "07/31/23",
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
