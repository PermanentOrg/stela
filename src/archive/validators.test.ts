import { validateGetPublicTagsParams } from "./validators";

describe("validateGetPublicTagsParams", () => {
  test("should find no errors in valid parameters", () => {
    let error = null;
    try {
      validateGetPublicTagsParams({
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
      validateGetPublicTagsParams({});
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });

  test("should error if archiveId is wrong type", () => {
    let error = null;
    try {
      validateGetPublicTagsParams({
        archiveId: 123,
      });
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
