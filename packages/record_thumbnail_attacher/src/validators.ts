import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

interface SQSMessage {
  Message: string;
}

const sqsMessageSchema: JSONSchemaType<SQSMessage> = {
  type: "object",
  properties: {
    Message: { type: "string" },
  },
  required: ["Message"],
  additionalProperties: true,
};

export const validateSqsMessage = ajv.compile(sqsMessageSchema);

interface NewDisseminationPackageJpgEvent {
  Records: {
    s3: {
      object: {
        key: string;
      };
    };
  }[];
}
const newDisseminationPackageJpgEventSchema: JSONSchemaType<NewDisseminationPackageJpgEvent> =
  {
    type: "object",
    properties: {
      Records: {
        type: "array",
        items: {
          type: "object",
          properties: {
            s3: {
              type: "object",
              properties: {
                object: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                  },
                  required: ["key"],
                  additionalProperties: true,
                },
              },
              required: ["object"],
              additionalProperties: true,
            },
          },
          required: ["s3"],
          additionalProperties: true,
        },
      },
    },
    required: ["Records"],
    additionalProperties: true,
  };

export const validateNewDisseminationPackageJpgEvent = ajv.compile(
  newDisseminationPackageJpgEventSchema
);
