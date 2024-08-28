import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

const ajv = new Ajv({ coerceTypes: true });

interface NewDisseminationPackageJpgEvent {
  s3: {
    object: {
      key: string;
    };
  };
}

const newDisseminationPackageJpgEventSchema: JSONSchemaType<NewDisseminationPackageJpgEvent> =
  {
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
  };

export const validateNewDisseminationPackageJpgEvent = ajv.compile(
  newDisseminationPackageJpgEventSchema
);
