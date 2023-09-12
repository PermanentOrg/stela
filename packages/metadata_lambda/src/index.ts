import { spawn } from "child_process";
import * as readline from "readline";
import * as path from "path";
import type { SQSHandler, SQSEvent, Context } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { NodeJsRuntimeStreamingBlobPayloadOutputTypes } from "@smithy/types";
import { DateTime } from "luxon";
import { find } from "geo-tz";
import "./env";
import { db } from "./database";
import type { Record } from "./models";

export const processMessages: SQSHandler = async (
  event: SQSEvent,
  _: Context
) => {
  for (const message of event.Records) {
    const { body } = message;
    const { originalFile } = JSON.parse(body);
    const metadata = await extractMetadata(originalFile.fileId);
    console.log(metadata);

    const recordResult = await db.sql<Record>("queries.get_record", {
      fileId: originalFile.fileId,
    });
    if (recordResult.rows[0] === undefined) {
      throw new Error("Record not found");
    }

    const record = recordResult.rows[0];

    const newDisplayName =
      !record.displayName ||
      record.displayName === path.parse(record.uploadFileName).name
        ? metadata["ObjectName"] ?? metadata["Title"] ?? record.displayName
        : record.displayName;

    const newDescription = !record.description
      ? metadata["Caption-Abstract"] ??
        metadata["UserComment"] ??
        record.description
      : record.description;

    const newTimezone =
      !record.timezonePlace &&
      metadata["GPSLatitude"] &&
      metadata["GPSLongitude"] &&
      metadata["GPSLatitudeRef"] &&
      metadata["GPSLongitudeRef"]
        ? determineTimezoneFromMetadata(
            metadata["GPSLatitude"],
            metadata["GPSLongitude"],
            metadata["GPSLatitudeRef"],
            metadata["GPSLongitudeRef"]
          )
        : record.timezonePlace;

    const derivedDateTime = determineTimestampFromMetadata(
      metadata,
      newTimezone
    );

    await db.sql<Record>("queries.update_record", {
      recordId: record.recordId,
      displayName: newDisplayName,
      description: newDescription,
      timezonePlace: newTimezone,
      derivedDate: derivedDateTime ? derivedDateTime.toISO() : null,
    });

    if (metadata["Keywords"]) {
      const keywords = metadata["Keywords"].split(", ");
      const keywordRows = keywords.map((keyword) => [
        keyword,
        record.archiveId,
        "status.generic.ok",
        "type.generic.placeholder",
      ]);

      await db
        .formattable("queries.insert_tag")
        .format(keywordRows, [keywords])
        .query({ recordId: record.recordId, archiveId: record.archiveId });
    }

    await db.sql("queries.insert_record_exif", {
      recordId: record.recordId,
      height: metadata["ImageHeight"],
      width: metadata["ImageWidth"],
      shutterSpeed: metadata["ShutterSpeedValue"], //rational
      focalLength: metadata["FocalLength"]
        ? metadata["FocalLength"].replace(" mm", "")
        : null,
      aperture: metadata["ApertureValue"],
      fNumber: metadata["FNumber"],
      exposure: metadata["ExposureTime"],
      iso: metadata["ISO"],
      brightness: metadata["BrightnessValue"],
      flash: metadata["Flash"] ? "Flash Fired" : "No Flash",
      whiteBalance: metadata["WhiteBalance"],
      xdpi: metadata["XResolution"],
      ydpi: metadata["YResolution"],
    });
  }
};

const extractMetadata = async (
  fileId: string
): Promise<{ [index: string]: string }> => {
  const s3Client = new S3Client({ region: process.env["AWS_REGION"] ?? "" });
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env["S3_BUCKET_NAME"],
    //TODO: make this generic for any dev
    Key: `${process.env["ENV"] === "local" ? "_Liam/" : ""}${fileId}`,
  });
  const { Body } = await s3Client.send(getObjectCommand);
  if (!Body) {
    throw new Error("File not found");
  }
  const exiftool = spawn("exiftool", ["-s", "-fast", "-"]);
  (Body as NodeJsRuntimeStreamingBlobPayloadOutputTypes).pipe(exiftool.stdin);
  const metadata = await readline.createInterface({
    input: exiftool.stdout,
  });
  var metadataObject: { [index: string]: string } = {};
  for await (const line of metadata) {
    const [key, ...rest] = line.split(":").map((s) => s.trim());
    if (!key || !rest) {
      throw new Error("Invalid metadata line");
    }
    metadataObject[key] = rest.join(":");
  }
  return metadataObject;
};

const determineTimezoneFromMetadata = (
  gpsLatitude: string,
  gpsLongitude: string,
  gpsLatitudeRef: string,
  gpsLongitudeRef: string
): string | null => {
  const latitudeComponents = gpsLatitude.match(/\d+(\.\d+)?/g);
  if (!latitudeComponents) {
    throw new Error("Invalid gpsLatitude");
  }
  const [latitudeDegrees, latitudeMinutes, latitudeSeconds] =
    latitudeComponents;
  if (!latitudeDegrees || !latitudeMinutes || !latitudeSeconds) {
    throw new Error("Invalid gpsLatitude");
  }
  const latitude = degreesMinutesSecondsToDecimal(
    +latitudeDegrees,
    +latitudeMinutes,
    +latitudeSeconds,
    gpsLatitudeRef
  );

  const longitudeComponents = gpsLongitude.match(/\d+(\.\d+)?/g);
  if (!longitudeComponents) {
    throw new Error("Invalid gpsLongitude");
  }
  const [longitudeDegrees, longitudeMinutes, longitudeSeconds] =
    longitudeComponents;
  if (!longitudeDegrees || !longitudeMinutes || !longitudeSeconds) {
    throw new Error("Invalid gpsLongitude");
  }
  const longitude = degreesMinutesSecondsToDecimal(
    +longitudeDegrees,
    +longitudeMinutes,
    +longitudeSeconds,
    gpsLongitudeRef
  );

  const possibleTimezones = find(latitude, longitude);
  const timezonePlace =
    possibleTimezones.length === 1 && possibleTimezones[0]
      ? possibleTimezones[0]
      : null;
  return timezonePlace;
};

const degreesMinutesSecondsToDecimal = (
  degrees: number,
  minutes: number,
  seconds: number,
  reference: string
): number => {
  const value = degrees + minutes / 60 + seconds / 3600;
  const sign = reference === "N" || reference === "E" ? 1 : -1;
  return sign * value;
};

const determineTimestampFromMetadata = (
  metadata: { [index: string]: string },
  timezone: string | null
): DateTime | null => {
  const offsetMap: {
    [index: string]:
      | "OffsetTimeOriginal"
      | "OffsetTimeDigitized"
      | "OffsetTime";
  } = {
    DateTimeOriginal: "OffsetTimeOriginal",
    CreateDate: "OffsetTimeDigitized",
    ModifyDate: "OffsetTime",
  };

  for (const key of Object.keys(offsetMap)) {
    const timestamp = metadata[key];
    if (timestamp && timestamp !== "0000:00:00 00:00:00") {
      if (timezone) {
        return DateTime.fromFormat(timestamp, "yyyy:MM:dd HH:mm:ss", {
          zone: timezone,
        }).setZone("utc");
      }
      const offsetKey = offsetMap[key];
      if (offsetKey && metadata[offsetKey]) {
        return DateTime.fromFormat(
          `${timestamp}${metadata[offsetKey]}`,
          "yyyy:MM:dd HH:mm:ssZZ"
        ).setZone("utc");
      }
    }
  }

  if (metadata["GPSDateStamp"] && metadata["GPSTimeStamp"]) {
    return DateTime.fromFormat(
      `${metadata["GPSDateStamp"]}T${metadata["GPSTimeStamp"]}+00:00`,
      "yyyy:MM:dd'T'HH:mm:ssZZ"
    ).setZone("utc");
  }

  return null;
};

// const parseNumberFromExif = (input: string): number | null => {
//   if (input.includes("/")) {
//   }
// };

processMessages(
  {
    Records: [
      {
        messageId: "test",
        receiptHandle: "test",
        body: JSON.stringify({
          originalFile: {
            //unprocessed/2ca2572d-a63b-4f09-8416-e4ef82961330
            fileId: "2",
          },
        }),
        attributes: {
          ApproximateReceiveCount: "test",
          SentTimestamp: "test",
          SenderId: "test",
          ApproximateFirstReceiveTimestamp: "test",
        },
        messageAttributes: {},
        md5OfBody: "test",
        eventSource: "test",
        eventSourceARN: "test",
        awsRegion: "us-west-2",
      },
    ],
  },
  {
    callbackWaitsForEmptyEventLoop: true,
    functionName: "test",
    functionVersion: "test",
    invokedFunctionArn: "test",
    memoryLimitInMB: "test",
    awsRequestId: "test",
    logGroupName: "test",
    logStreamName: "test",
    getRemainingTimeInMillis: () => 1000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  },
  () => {}
);
