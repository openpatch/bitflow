import type { Diagnostic } from "@bitflow/core";
import { useId, useState, type ReactElement, type ReactNode } from "react";

/**
 * The authoring-form building blocks every bit's `Form` is made of.
 *
 * They exist here rather than in each bit so a teacher meets the same layout,
 * the same hint placement and the same error treatment in every task editor —
 * the "teacher-first authoring" principle is mostly a promise of consistency.
 */

export type FieldProps = {
  label: string;
  /** The one-line explanation under the label. Most fields deserve one. */
  hint?: string;
  /** Message shown beneath the control, tied to it for screen readers. */
  error?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
};

export const Field = ({
  label,
  hint,
  error,
  children,
}: FieldProps): ReactElement => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="bitflow-field">
      <label className="bitflow-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="bitflow-hint" id={hintId}>
          {hint}
        </span>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <span className="bitflow-field-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export type TextFieldProps = Omit<FieldProps, "children"> & {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export const TextField = ({
  value,
  placeholder,
  onChange,
  ...field
}: TextFieldProps): ReactElement => (
  <Field {...field}>
    {(props) => (
      <input
        {...props}
        type="text"
        className="bitflow-input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </Field>
);

export type SecondsFieldProps = Omit<FieldProps, "children"> & {
  /** Seconds, or `undefined` for no limit at all. */
  value: number | undefined;
  onChange: (seconds: number | undefined) => void;
};

/**
 * A duration in seconds where leaving it blank means "no limit".
 *
 * Blank and zero have to stay distinguishable — zero seconds would be a limit
 * that has already expired — so this never coerces an empty box to a number.
 */
export const SecondsField = ({
  value,
  onChange,
  ...field
}: SecondsFieldProps): ReactElement => (
  <Field {...field}>
    {(props) => (
      <input
        {...props}
        type="number"
        className="bitflow-input"
        min={0}
        step={10}
        value={value ?? ""}
        onChange={(event) => {
          const seconds = Number(event.target.value);
          onChange(
            event.target.value === "" || !Number.isFinite(seconds) || seconds <= 0
              ? undefined
              : Math.round(seconds),
          );
        }}
      />
    )}
  </Field>
);

export type TextAreaFieldProps = TextFieldProps & { rows?: number };

export const TextAreaField = ({
  value,
  placeholder,
  rows = 4,
  onChange,
  ...field
}: TextAreaFieldProps): ReactElement => (
  <Field {...field}>
    {(props) => (
      <textarea
        {...props}
        className="bitflow-textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </Field>
);

export type SelectFieldProps<T extends string> = Omit<FieldProps, "children"> & {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

export const SelectField = <T extends string>({
  value,
  options,
  onChange,
  ...field
}: SelectFieldProps<T>): ReactElement => (
  <Field {...field}>
    {(props) => (
      <select
        {...props}
        className="bitflow-select"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )}
  </Field>
);

export type CheckboxFieldProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const CheckboxField = ({
  label,
  hint,
  checked,
  onChange,
}: CheckboxFieldProps): ReactElement => (
  <label className="bitflow-option">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>
      <span className="bitflow-label">{label}</span>
      {hint && <span className="bitflow-hint"> — {hint}</span>}
    </span>
  </label>
);

/**
 * The "Advanced" disclosure. Uncommon scoring, accessibility and evaluation
 * settings live behind one of these so the common case — prompt, choices,
 * correct answer, feedback — is the whole of what a teacher sees first.
 *
 * A native `<details>`: it is keyboard-operable and findable by in-page search
 * even while collapsed, which a JS-toggled div is not.
 */
export const Disclosure = ({
  summary,
  aside,
  children,
  defaultOpen = false,
  open: controlled,
  onOpenChange,
}: {
  summary: string;
  /** A quieter second line — what is inside, without opening it. */
  aside?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /**
   * Set to drive the state from outside. Left off, the disclosure keeps its
   * own — which is what most callers want and none of them should have to say.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): ReactElement => {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlled ?? uncontrolled;

  return (
    <details
      className="bitflow-disclosure"
      open={open}
      onToggle={(event) => {
        const next = (event.target as HTMLDetailsElement).open;
        if (next === open) return;
        setUncontrolled(next);
        onOpenChange?.(next);
      }}
    >
      <summary className="bitflow-disclosure-summary">
        {summary}
        {aside && <span className="bitflow-disclosure-aside">{aside}</span>}
      </summary>
      <div className="bitflow-stack">{children}</div>
    </details>
  );
};

/**
 * Picks the message for one field out of a node's diagnostics.
 *
 * Matches the exact path or any deeper one, so an error reported against
 * `choices.0.markdown` still surfaces on the `choices` field when that is the
 * closest thing the form actually renders.
 */
export const errorFor = (
  errors: Diagnostic[] | undefined,
  path: string,
): string | undefined =>
  errors?.find((d) => d.path === path || d.path.startsWith(`${path}.`))?.message;
