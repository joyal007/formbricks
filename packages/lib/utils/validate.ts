import z from "zod";

import { ValidationError } from "@formbricks/types/errors";

import { logger } from "./logger";

type ValidationPair = [any, z.ZodSchema<any>];

export const validateInputs = (...pairs: ValidationPair[]): void => {
  for (const [value, schema] of pairs) {
    const inputValidation = schema.safeParse(value);

    if (!inputValidation.success) {
      logger.error(
        `Validation failed for ${JSON.stringify(value)} and ${JSON.stringify(schema)}: ${inputValidation.error.message}`
      );
      throw new ValidationError("Validation failed");
    }
  }
};
