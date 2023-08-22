import { spawn } from "child_process";
import * as readline from "readline";
import * as path from "path";
import type { SQSHandler, SQSEvent, Context } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { NodeJsRuntimeStreamingBlobPayloadOutputTypes } from "@smithy/types";
import "./env";
import { db } from "./database";
import type { Record } from "./models";

export const processMessages: SQSHandler = async (
  event: SQSEvent,
  _: Context
) => {
  const s3Client = new S3Client({ region: process.env["AWS_REGION"] ?? "" });
  for (const message of event.Records) {
    const { body } = message;
    const { originalFile } = JSON.parse(body);
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env["S3_BUCKET_NAME"],
      Key: `${process.env["ENV"] === "local" ? "_Liam/" : ""}${
        originalFile.fileId
      }`,
    });
    const { Body } = await s3Client.send(getObjectCommand);
    const exiftool = spawn("exiftool", ["-s", "-fast", "-"]);
    if (!Body) {
      throw new Error("File not found");
    }
    (Body as NodeJsRuntimeStreamingBlobPayloadOutputTypes).pipe(exiftool.stdin);
    const metadata = await readline.createInterface({
      input: exiftool.stdout,
    });
    var metadataObject: { [index: string]: string } = {};
    for await (const line of metadata) {
      const [key, value] = line.split(":").map((s) => s.trim());
      if (!key || !value) {
        throw new Error("Invalid metadata line");
      }
      metadataObject[key] = value;
    }

    console.log(metadataObject);
    const recordResult = await db.sql<Record>("queries.get_record", {
      fileId: originalFile.fileId,
    });
    if (recordResult.rows[0] === undefined) {
      throw new Error("Record not found");
    }

    const record = recordResult.rows[0];
    console.log(record);

    const newDisplayName =
      metadataObject["ObjectName"] &&
      (!record.displayName ||
        record.displayName === path.parse(record.uploadFileName).name)
        ? metadataObject["ObjectName"]
        : record.displayName;

    const newDescription =
      metadataObject["Caption-Abstract"] && !record.description
        ? metadataObject["Caption-Abstract"]
        : record.description;

    console.log(newDisplayName);
    console.log(newDescription);
    const updateResult = await db.sql<Record>("queries.update_record", {
      recordId: record.recordId,
      displayName: newDisplayName,
      description: newDescription,
    });

    console.log(updateResult);
  }
};

processMessages(
  {
    Records: [
      {
        messageId: "test",
        receiptHandle: "test",
        body: JSON.stringify({
          originalFile: {
            //unprocessed/2ca2572d-a63b-4f09-8416-e4ef82961330
            fileId: "1",
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
