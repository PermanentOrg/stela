import Ajv, { type JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

export interface SQSMessage {
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

export interface S3Object {
  key: string;
  size: number;
  versionId: string;
}

export interface NewDisseminationPackageJpgEvent {
  Records: {
    s3: {
      object: S3Object;
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
                    size: { type: "number" },
                    versionId: { type: "string" },
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
