import { getOriginalFileIdFromInformationPackagePath } from "./index";

describe("getFileIdFromInformationPackagePath", () => {
  test("should return the file ID if the file ID is a number", () => {
    const fileId = getOriginalFileIdFromInformationPackagePath(
      "access_copies/1beb/41dc/92a9/4d47/a274/8f24/b1ed/d199/37_upload-05c83751-bdf9-4c0b-b37d-25bed5177853/thumbnails/2d31697a-39e5-47db-8d79-a1e6ceae0613.jpg"
    );
    expect(fileId).toEqual("37");
  });

  test("should return the file ID if the file ID is a uuid", () => {
    const fileId = getOriginalFileIdFromInformationPackagePath(
      "access_copies/1beb/41dc/92a9/4d47/a274/8f24/b1ed/d199/346c2cb4-1d10-4eda-a2e0-73836df3c3d6_upload-05c83751-bdf9-4c0b-b37d-25bed5177853/thumbnails/2d31697a-39e5-47db-8d79-a1e6ceae0613.jpg"
    );
    expect(fileId).toEqual("346c2cb4-1d10-4eda-a2e0-73836df3c3d6");
  });

  test("should throw an error if no file ID can be found in the path", () => {
    let error = null;
    try {
      getOriginalFileIdFromInformationPackagePath("malformed_path");
    } catch (err) {
      error = err;
    } finally {
      expect(error).not.toBeNull();
    }
  });
});
