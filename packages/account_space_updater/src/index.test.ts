import type { Context } from "aws-lambda";
import { db } from "./database";
import { handler } from "./index";

jest.mock("./database");

describe("handler", () => {
  const loadFixtures = async (): Promise<void> => {
    await db.sql("fixtures.create_test_accounts");
    await db.sql("fixtures.create_test_account_space");
    await db.sql("fixtures.create_test_archives");
    await db.sql("fixtures.create_test_records");
    await db.sql("fixtures.create_test_files");
    await db.sql("fixtures.create_test_record_files");
  };

  const clearDatabase = async (): Promise<void> => {
    await db.query(
      `TRUNCATE
        account,
        account_space,
        archive,
        record,
        file,
        record_file,
        ledger_nonfinancial
      CASCADE`
    );
  };

  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should correctly update account_space and ledger_nonfinancial", async () => {
    const initialAccountSpaceResult = await db.query<{
      spaceLeft: string;
      spaceTotal: string;
      fileLeft: string;
      fileTotal: string;
    }>(
      `SELECT 
        spaceLeft AS "spaceLeft",
        spaceTotal AS "spaceTotal",
        fileLeft AS "fileLeft",
        fileTotal AS "fileTotal"
      FROM
        account_space
      WHERE
        accountId = 2`
    );
    const initialAccountSpace = initialAccountSpaceResult.rows[0];
    await handler(
      {
        Records: [
          {
            messageId: "1",
            receiptHandle: "1",
            body: JSON.stringify({ recordId: "1" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1",
              SenderId: "1",
              ApproximateFirstReceiveTimestamp: "1",
            },
            messageAttributes: {
              Action: { stringValue: "submit", dataType: "string" },
            },
            md5OfBody: "1",
            eventSource: "1",
            eventSourceARN: "1",
            awsRegion: "1",
          },
        ],
      },
      {} as Context,
      () => {}
    );
    const updatedAccountSpaceResult = await db.query<{
      spaceLeft: string;
      fileLeft: string;
    }>(
      `SELECT 
        spaceLeft AS "spaceLeft",
        fileLeft AS "fileLeft"
      FROM
        account_space
      WHERE
        accountId = 2`
    );
    const updatedAccountSpace = updatedAccountSpaceResult.rows[0];
    const ledgerEntryResult = await db.query<{
      type: string;
      spaceDelta: string;
      fileDelta: string;
      fromSpaceBefore: string;
      fromSpaceLeft: string;
      fromSpaceTotal: string;
      fromFileBefore: string;
      fromFileLeft: string;
      fromFileTotal: string;
      toSpaceBefore: string;
      toSpaceLeft: string;
      toSpaceTotal: string;
      toFileBefore: string;
      toFileLeft: string;
      toFileTotal: string;
    }>(
      `SELECT
        type,
        spaceDelta "spaceDelta",
        fileDelta "fileDelta",
        fromSpaceBefore "fromSpaceBefore",
        fromSpaceLeft "fromSpaceLeft",
        fromSpaceTotal "fromSpaceTotal",
        fromFileBefore "fromFileBefore",
        fromFileLeft "fromFileLeft",
        fromFileTotal "fromFileTotal",
        toSpaceBefore "toSpaceBefore",
        toSpaceLeft "toSpaceLeft",
        toSpaceTotal "toSpaceTotal",
        toFileBefore "toFileBefore",
        toFileLeft "toFileLeft",
        toFileTotal "toFileTotal"
      FROM
        ledger_nonfinancial
      WHERE
        recordId = 1`
    );
    const ledgerEntry = ledgerEntryResult.rows[0];

    if (!initialAccountSpace || !updatedAccountSpace || !ledgerEntry) {
      expect(false).toBe(true);
    } else {
      expect(updatedAccountSpace).toEqual({
        spaceLeft: (+initialAccountSpace.spaceLeft - 1024).toString(),
        fileLeft: (+initialAccountSpace.fileLeft - 1).toString(),
      });
      expect(ledgerEntry).toEqual({
        type: "type.billing.file_upload",
        spaceDelta: "1024",
        fileDelta: "1",
        fromSpaceBefore: initialAccountSpace.spaceLeft,
        fromSpaceLeft: updatedAccountSpace.spaceLeft,
        fromSpaceTotal: initialAccountSpace.spaceTotal,
        fromFileBefore: initialAccountSpace.fileLeft,
        fromFileLeft: updatedAccountSpace.fileLeft,
        fromFileTotal: initialAccountSpace.fileTotal,
        toSpaceBefore: "0",
        toSpaceLeft: "0",
        toSpaceTotal: "0",
        toFileBefore: "0",
        toFileLeft: "0",
        toFileTotal: "0",
      });
    }
  });

  test("should throw an error if the message body is invalid", async () => {
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({ fileId: "1" }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1",
                SenderId: "1",
                ApproximateFirstReceiveTimestamp: "1",
              },
              messageAttributes: {
                Action: { stringValue: "submit", dataType: "string" },
              },
              md5OfBody: "1",
              eventSource: "1",
              eventSourceARN: "1",
              awsRegion: "1",
            },
          ],
        },
        {} as Context,
        () => {}
      );
    } catch (err) {
      error = err;
    }
    expect(error).toEqual(new Error("Invalid message body"));
  });

  test("should throw an error if the action attribute is missing", async () => {
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({ recordId: "1" }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1",
                SenderId: "1",
                ApproximateFirstReceiveTimestamp: "1",
              },
              messageAttributes: {},
              md5OfBody: "1",
              eventSource: "1",
              eventSourceARN: "1",
              awsRegion: "1",
            },
          ],
        },
        {} as Context,
        () => {}
      );
    } catch (err) {
      error = err;
    }
    expect(error).toEqual(new Error("Action attribute is missing"));
  });

  test("should not throw an error if the ledger entry already exists", async () => {
    await db.query(
      `INSERT INTO ledger_nonfinancial (
        recordId,
        type,
        fromAccountId,
        spaceDelta,
        fileDelta,
        fromSpaceBefore,
        fromSpaceLeft,
        fromSpaceTotal,
        fromFileBefore,
        fromFileLeft,
        fromFileTotal,
        toAccountId,
        toSpaceBefore,
        toSpaceLeft,
        toSpaceTotal,
        toFileBefore,
        toFileLeft,
        toFileTotal,
        fileId,
        status,
        createddt,
        updateddt
      ) VALUES (
        1,
        'type.billing.file_upload',
        2,
        1024,
        1,
        1024,
        0,
        1024,
        1,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        'status.generic.ok',
        NOW(),
        NOW()
      )`
    );
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({ recordId: "1" }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1",
                SenderId: "1",
                ApproximateFirstReceiveTimestamp: "1",
              },
              messageAttributes: {
                Action: { stringValue: "submit", dataType: "string" },
              },
              md5OfBody: "1",
              eventSource: "1",
              eventSourceARN: "1",
              awsRegion: "1",
            },
          ],
        },
        {} as Context,
        () => {}
      );
    } catch (err) {
      error = err;
    }
    expect(error).toEqual(null);
  });
});
