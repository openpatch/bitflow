import { useEffect, useState, type ReactElement } from "react";

/**
 * A number typed as text. Held as a draft while it is typed, since "-", "3."
 * and "" are all on the way to a number without being one, and a controlled
 * field that only accepted finished numbers would throw each of them away — a
 * negative axis minimum could never be started. A comma works as the decimal
 * point too. Copied from task-point-plot's field of the same name — used in
 * both the plot itself (the number-field fallback for each handle) and the
 * authoring form (axis bounds, tolerance), so it lives once here instead of
 * being written twice.
 */
export const NumberInput = ({
  value,
  onChange,
  ...props
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}): ReactElement => {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
    // Only an outside change should reset the draft; `text` is ours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="text"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const next = Number(event.target.value.replace(",", "."));
        if (event.target.value.trim() !== "" && Number.isFinite(next)) onChange(next);
      }}
    />
  );
};
