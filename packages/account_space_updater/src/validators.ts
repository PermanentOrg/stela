import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

interface RecordSubmitEvent {
  recordId: string;
}

const recordSubmitEventSchema: JSONSchemaType<RecordSubmitEvent> = {
  type: "object",
  properties: {
    recordId: { type: "string" },
  },
  required: ["recordId"],
  additionalProperties: true,
};

export const validateRecordSubmitEvent = ajv.compile(recordSubmitEventSchema);
