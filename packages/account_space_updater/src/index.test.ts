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

  interface AccountSpaceStartingState {
    spaceLeft: string;
    spaceTotal: string;
    fileLeft: string;
    fileTotal: string;
  }

  const getInitialAccountSpace = async (): Promise<
    AccountSpaceStartingState | undefined
  > => {
    const initialAccountSpaceResult = await db.query<AccountSpaceStartingState>(
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
    return initialAccountSpaceResult.rows[0];
  };

  interface AccountSpaceAfterUpdate {
    spaceLeft: string;
    fileLeft: string;
  }

  const getUpdatedAccountSpace = async (): Promise<
    AccountSpaceAfterUpdate | undefined
  > => {
    const updatedAccountSpaceResult = await db.query<AccountSpaceAfterUpdate>(
      `SELECT 
        spaceLeft AS "spaceLeft",
        fileLeft AS "fileLeft"
      FROM
        account_space
      WHERE
        accountId = 2`
    );
    return updatedAccountSpaceResult.rows[0];
  };

  interface LedgerEntry {
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
  }

  const getLedgerEntry = async (): Promise<LedgerEntry | undefined> => {
    const ledgerEntryResult = await db.query<LedgerEntry>(
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
    return ledgerEntryResult.rows[0];
  };

  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  test("should correctly update account_space and ledger_nonfinancial when a record is created", async () => {
    const initialAccountSpace = await getInitialAccountSpace();
    await handler(
      {
        Records: [
          {
            messageId: "1",
            receiptHandle: "1",
            body: JSON.stringify({
              Message: JSON.stringify({
                entity: "record",
                action: "create",
                body: { record: { recordId: "1" } },
              }),
            }),
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
    const updatedAccountSpace = await getUpdatedAccountSpace();
    const ledgerEntry = await getLedgerEntry();

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

  test("should correctly update account_space and ledger_nonfinancial when a record is created", async () => {
    const initialAccountSpace = await getInitialAccountSpace();
    await handler(
      {
        Records: [
          {
            messageId: "1",
            receiptHandle: "1",
            body: JSON.stringify({
              Message: JSON.stringify({
                entity: "record",
                action: "copy",
                body: { newRecord: { recordId: "1" } },
              }),
            }),
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
    const updatedAccountSpace = await getUpdatedAccountSpace();
    const ledgerEntry = await getLedgerEntry();

    if (!initialAccountSpace || !updatedAccountSpace || !ledgerEntry) {
      expect(false).toBe(true);
    } else {
      expect(updatedAccountSpace).toEqual({
        spaceLeft: (+initialAccountSpace.spaceLeft - 1024).toString(),
        fileLeft: (+initialAccountSpace.fileLeft - 1).toString(),
      });
      expect(ledgerEntry).toEqual({
        type: "type.billing.file_copy",
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
    expect(error).toEqual(new Error("Invalid message body"));
  });

  test("should throw an error if the internal message is invalid", async () => {
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({
                Message: JSON.stringify({ fileId: "1" }),
              }),
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
    expect(error).toEqual(new Error("Invalid message"));
  });

  test("should throw an error if record.create event is missing the record field", async () => {
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({
                Message: JSON.stringify({
                  entity: "record",
                  action: "create",
                  body: { newRecord: { recordId: "1" } },
                }),
              }),
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
    expect(error).toEqual(
      new Error("record field missing in body of record.create")
    );
  });

  test("should throw an error if record.copy event is missing the newRecord field", async () => {
    let error = null;
    try {
      await handler(
        {
          Records: [
            {
              messageId: "1",
              receiptHandle: "1",
              body: JSON.stringify({
                Message: JSON.stringify({
                  entity: "record",
                  action: "copy",
                  body: { record: { recordId: "1" } },
                }),
              }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1",
                SenderId: "1",
                ApproximateFirstReceiveTimestamp: "1",
              },
              messageAttributes: {
                Action: { stringValue: "copy", dataType: "string" },
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
    expect(error).toEqual(
      new Error("newRecord field missing in body of record.copy")
    );
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
              body: JSON.stringify({
                Message: JSON.stringify({
                  entity: "record",
                  action: "create",
                  body: { record: { recordId: "1" } },
                }),
              }),
              attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1",
                SenderId: "1",
                ApproximateFirstReceiveTimestamp: "1",
              },
              messageAttributes: {
                Action: { stringValue: "create", dataType: "string" },
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
