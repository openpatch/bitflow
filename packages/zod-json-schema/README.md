# @openpatch/bits-stats

Does what it says on the tin! Supports all relevant schema types as well as basic string, number and array length validations.

String pattern validation (ie email, regexp etc) is not available since Zod doesn't seem to expose the regexp source in any way I can find. Perhaps in later versions, though!


## Installation

```sh
yarn add @bitflow/zod-json-schema
# or
npm i @bitflow/zod-json-schema
```

## Usage

```typescript
import * as z from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const mySchema = z.object({
  myString: z.string().min(5),
  myUnion: z.union([z.number(), z.boolean()]),
});

const jsonSchema = zodToJsonSchema(mySchema, 'mySchema');
```

Expected output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/mySchema",
  "definitions": {
    "mySchema": {
      "type": "object",
      "properties": {
        "myString": {
          "type": "string",
          "minLength": 5
        },
        "myUnion": {
          "type": ["number", "boolean"]
        }
      },
      "additionalProperties": false,
      "required": ["myString", "myUnion"]
    }
  }
}
```