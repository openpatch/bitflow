export function ensure<T>(
  argument: T | undefined | null,
  message: string = "This value was promised to be there."
): T {
  if (argument === undefined || argument === null) {
    throw new TypeError(message);
  }

  return argument;
}
export type GetAnswers = (
  nodeIds: string[]
) => Promise<Record<string, Bitflow.TaskAnswer>>;
export type GetResults = (
  nodeIds: string[]
) => Promise<Record<string, Bitflow.TaskResult>>;
export type GetPoints = () => Promise<number>;
