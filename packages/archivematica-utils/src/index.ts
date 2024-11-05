import { logger } from "@stela/logger";

export const getOriginalFileIdFromInformationPackagePath = (
  path: string
): string => {
  // The path will inlude the substring /{fileId}_upload, which is what this regex looks for. The fileId is either
  // numeric or a UUID, so we expect it to consist of some hexadecimal digits and hyphens.
  const fileIdRegex =
    /access_copies(?:\/[0-9a-f]{4}){8}\/(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_upload/;
  const match = fileIdRegex.exec(path);
  if (match === null || match[1] === undefined) {
    logger.error(`Invalid file key: ${path}`);
    throw new Error("Invalid file key");
  }
  return match[1];
};
