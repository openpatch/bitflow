import { EndBit, InputBit, StartBit, TaskBit, TitleBit } from "@bitflow/core";
import { useContext } from "react";
import { context } from "./context";

export function useBits(type: "end"): Record<string, EndBit>;
export function useBits(type: "start"): Record<string, StartBit>;
export function useBits(type: "input"): Record<string, InputBit>;
export function useBits(type: "title"): Record<string, TitleBit>;
export function useBits(type: "task"): Record<string, TaskBit>;
export function useBits(type: string) {
  const { bits } = useContext(context);
  return bits[type];
}

export function useBit<E extends Bitflow.End>(
  type: "end",
  subtype?: Bitflow.End["subtype"]
): EndBit<E> | null;
export function useBit<S extends Bitflow.Start>(
  type: "start",
  subtype?: Bitflow.Start["subtype"]
): StartBit<S> | null;
export function useBit<T extends Bitflow.Title>(
  type: "title",
  subtype?: Bitflow.Title["subtype"]
): TitleBit<T> | null;
export function useBit<
  T extends Bitflow.Task,
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult,
  S extends Bitflow.TaskStatistic
>(type: "task", subtype?: Bitflow.Task["subtype"]): TaskBit<T, A, R, S> | null;
export function useBit<I extends Bitflow.Input>(
  type: "input",
  subtype?: Bitflow.Input["subtype"]
): InputBit<I> | null;
export function useBit(type?: string, subtype?: string): any {
  const { bits } = useContext(context);
  if (!type || !subtype) {
    return null;
  }

  return bits[type]?.[subtype] || null;
}

export const useBitTask = <
  T extends Bitflow.Task,
  A extends Bitflow.TaskAnswer,
  R extends Bitflow.TaskResult,
  S extends Bitflow.TaskStatistic
>(
  subtype?: Bitflow.Task["subtype"]
) => {
  const bit = useBit<T, A, R, S>("task", subtype);
  return bit;
};

export const useBitTitle = <T extends Bitflow.Title>(
  subtype?: Bitflow.Title["subtype"]
) => {
  const bit = useBit<T>("title", subtype);
  return bit;
};

export const useBitInput = <I extends Bitflow.Input>(
  subtype?: Bitflow.Input["subtype"]
) => {
  const bit = useBit<I>("input", subtype);
  return bit;
};

export const useBitStart = <S extends Bitflow.Start>(
  subtype?: Bitflow.Start["subtype"]
) => {
  const bit = useBit<S>("start", subtype);
  return bit;
};

export const useBitEnd = <E extends Bitflow.End>(
  subtype?: Bitflow.End["subtype"]
) => {
  const bit = useBit<E>("end", subtype);
  return bit;
};
