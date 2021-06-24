import { ZodSchema } from "zod";
import { JsonSchema7Type, parseDef } from "./parseDef";

/**
 * @param schema The Zod schema to be converted
 */
function zodToJsonSchema(schema: ZodSchema<any>):
  | ({
      $schema: "http://json-schema.org/draft-07/schema#";
    } & JsonSchema7Type)
  | unknown;
/**
 * @param schema The Zod schema to be converted
 * @param name The (optional) name of the schema. If a name is passed, the schema will be put in 'definitions' and referenced from the root.
 */
function zodToJsonSchema<T extends string>(
  schema: ZodSchema<any>,
  name: T
): {
  $schema: "http://json-schema.org/draft-07/schema#";
  $ref: string;
  definitions: Record<T, JsonSchema7Type>;
};
function zodToJsonSchema(schema: ZodSchema<any>, name?: string) {
  // console.log(schema)

  return name === undefined
    ? {
        $schema: "http://json-schema.org/draft-07/schema#",
        ...parseDef(schema, [], []),
      }
    : {
        $schema: "http://json-schema.org/draft-07/schema#",
        $ref: `#/$defs/${name}`,
        $defs: {
          [name]: parseDef(schema, ["$defs", name], []) || {},
        },
      };
}

export { zodToJsonSchema };
