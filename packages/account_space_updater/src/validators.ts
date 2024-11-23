import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

interface RecordSubmitEvent {
  body: {
    record?: {
      recordId: string;
    };
    newRecord?: {
      recordId: string;
    };
  };
}

const recordSubmitEventSchema: JSONSchemaType<RecordSubmitEvent> = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        record: {
          type: "object",
          properties: {
            recordId: { type: "string" },
          },
          required: ["recordId"],
          additionalProperties: true,
          nullable: true,
        },
        newRecord: {
          type: "object",
          properties: {
            recordId: { type: "string" },
          },
          required: ["recordId"],
          additionalProperties: true,
          nullable: true,
        },
      },
      additionalProperties: true,
    },
  },
  required: ["body"],
  additionalProperties: true,
};

export const validateRecordSubmitEvent = ajv.compile(recordSubmitEventSchema);
