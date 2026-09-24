/**
 * The arithmetic this bit reads answers with lives in `@bitflow/core`, where
 * task-function-plot reads its functions with the same grammar. Re-exported
 * under the names this package has always used.
 */
export {
  canonicalUnit,
  EXPRESSION_CONSTANTS as CONSTANTS,
  EXPRESSION_FUNCTIONS as FUNCTIONS,
  EXPRESSION_MAX_LENGTH as MAX_LENGTH,
  parseExpression,
  parseQuantity,
  type DecimalSeparator,
  type ParseFailure,
  type ParseOptions,
  type ParseResult,
  type Quantity,
  type QuantityResult,
} from "@bitflow/core";
