import { ZodTypeDef, ZodUnionDef } from 'zod';
import { JsonSchema7Type, parseDef } from '../parseDef';

const mappings = {
  ZodString: 'string',
  ZodNumber: 'number',
  ZodBigInt: 'integer',
  ZodBoolean: 'boolean',
  ZodNull: 'null',
};

type JsonSchema7Primitive =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null';

export type JsonSchema7PrimitiveUnionType =
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
    }
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
      enum: (string | number | bigint | boolean | null)[];
    };

export type JsonSchema7AnyOfType = {
  anyOf: JsonSchema7Type[];
};

export function parseUnionDef(
  def: ZodUnionDef,
  path: string[],
  visited: { def: ZodTypeDef; path: string[] }[]
):
  | JsonSchema7PrimitiveUnionType
  | JsonSchema7AnyOfType
  | JsonSchema7Type
  | undefined {
  const options = def.options.filter((x) => x.constructor.name !== 'undefined');
  //
  if (options.length === 1) {
    return parseDef(options[0]._def, path, visited); // likely union with undefined, and thus probably optional object property
  }

  // This blocks tries to look ahead a bit to produce nicer looking schemas with type array instead of anyOf.
  if (
    options.every(
      (x) =>
        [
          'ZodString',
          'ZodNumber',
          'ZodBigInt',
          'ZodBoolean',
          'ZodNull',
        ].includes(x.constructor.name) &&
        (!x._def.checks || !x._def.checks.length)
    )
  ) {
    // all types in union are primitive, so might as well squash into {type: [...]}
    //
    const types = options
      .reduce((types, option) => {
        //
        return types.includes(option.constructor.name)
          ? types
          : [...types, (mappings as any)[option.constructor.name]];
      }, [] as string[])
      .map((x) => (x === 'bigint' ? 'integer' : x));
    return {
      type: types.length > 1 ? types : types[0],
    };
  } else if (options.every((x) => x.constructor.name === 'ZodLiteral')) {
    // all options literals
    const types = options.reduce((types, option) => {
      let type: string = typeof option._def.value;
      if (type === 'bigint') {
        type = 'integer';
      } else if (type === 'object' && option._def.value === null) {
        type = 'null';
      }
      return types.includes(type) ? types : [...types, type];
    }, [] as string[]);

    if (
      types.every((x) =>
        ['string', 'number', 'bigint', 'boolean', 'null'].includes(x)
      )
    ) {
      // all the literals are primitive, as far as null can be considered primitive
      return {
        type: types.length > 1 ? types : types[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [] as (string | number | bigint | boolean | null)[]),
      };
    }
  }

  return {
    // Fallback to verbose anyOf. This will always work schematically but it does get quite ugly at times.

    anyOf: options.map((x, i) =>
      parseDef(x, [...path, 'anyOf', i.toString()], visited)
    ),
  };
}
