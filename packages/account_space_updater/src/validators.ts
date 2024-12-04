import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

interface RecordSubmitEvent {
  entity: string;
  action: string;
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
    entity: { type: "string" },
    action: { type: "string" },
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
  required: ["body", "entity", "action"],
  additionalProperties: true,
};

export const validateRecordSubmitEvent = ajv.compile(recordSubmitEventSchema);
