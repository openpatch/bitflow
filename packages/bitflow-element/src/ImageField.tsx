import {
  formatBytes,
  isEmbedded,
  sourceBytes,
  translate,
  type Image,
  type Locale,
} from "@bitflow/core";
import { useId, useRef, useState, type ReactElement } from "react";
import { messages } from "./messages";
import { readImageFile, type ReadImageOptions } from "./readImage";

/**
 * Choosing a picture, and saying what it shows.
 *
 * The two are one field because they are one decision: an image without
 * alternative text is a task that does not exist for part of the class, and
 * splitting them is how that gets forgotten. The picture is embedded in the
 * document rather than linked, and the field says what that costs so the
 * author can see a photograph turn into half a megabyte.
 */
export const ImageField = ({
  value,
  onChange,
  locale,
  label,
  hint,
  altLabel,
  altHint,
  error,
  altError,
  /** Set false where the picture is decoration rather than content. */
  altRequired = true,
  options,
}: {
  value: Image;
  onChange: (image: Image) => void;
  locale: Locale;
  label?: string;
  hint?: string;
  altLabel?: string;
  altHint?: string;
  error?: string;
  altError?: string;
  altRequired?: boolean;
  options?: ReadImageOptions;
}): ReactElement => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, locale, vars);

  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setFailure(null);
    try {
      const src = await readImageFile(file, options);
      // The file name is a reasonable first draft of the alt text — better
      // than an empty box, and something to correct rather than invent.
      onChange({ src, alt: value.alt || suggestAlt(file.name) });
    } catch {
      setFailure(t("imageFailed"));
    } finally {
      setBusy(false);
      // Cleared so choosing the same file again still fires a change.
      if (input.current) input.current.value = "";
    }
  };

  const linked = value.src !== "" && !isEmbedded(value.src);

  return (
    <div className="bitflow-field bitflow-image-field">
      <span className="bitflow-label" id={`${id}-label`}>
        {label ?? t("imageLabel")}
      </span>
      <span className="bitflow-hint" id={`${id}-hint`}>
        {hint ?? t("imageHint")}
      </span>

      <div className="bitflow-image-row">
        {value.src ? (
          <img className="bitflow-image-preview" src={value.src} alt="" />
        ) : (
          <div className="bitflow-image-preview bitflow-image-preview-empty" />
        )}

        <div className="bitflow-stack-small bitflow-stack">
          <input
            ref={input}
            id={id}
            type="file"
            className="bitflow-input"
            accept="image/*"
            aria-describedby={`${id}-hint`}
            aria-labelledby={`${id}-label`}
            disabled={busy}
            onChange={(event) => void choose(event.target.files?.[0])}
          />

          {busy && <span className="bitflow-hint">{t("imageWorking")}</span>}

          {value.src !== "" && !busy && (
            <span className="bitflow-hint">
              {t("imageSize", { size: formatBytes(sourceBytes(value.src)) })}
            </span>
          )}

          {value.src !== "" && (
            <button
              type="button"
              className="bitflow-button bitflow-button-quiet"
              onClick={() => onChange({ src: "", alt: value.alt })}
            >
              {t("imageRemove")}
            </button>
          )}
        </div>
      </div>

      {failure && (
        <span className="bitflow-field-error" role="alert">
          {failure}
        </span>
      )}
      {error && (
        <span className="bitflow-field-error" role="alert">
          {error}
        </span>
      )}

      {/* A document written before pictures were embedded, or edited by hand.
          It still works today and stops working the moment the file is opened
          somewhere without that address. */}
      {linked && <span className="bitflow-hint">{t("imageLinked")}</span>}

      {altRequired && (
        <label className="bitflow-field">
          <span className="bitflow-label">{altLabel ?? t("imageAltLabel")}</span>
          <span className="bitflow-hint">{altHint ?? t("imageAltHint")}</span>
          <textarea
            className="bitflow-textarea"
            rows={2}
            value={value.alt}
            onChange={(event) => onChange({ ...value, alt: event.target.value })}
          />
          {altError && (
            <span className="bitflow-field-error" role="alert">
              {altError}
            </span>
          )}
        </label>
      )}
    </div>
  );
};

/** `cpu-diagram.png` → `cpu diagram`. A starting point, not an answer. */
const suggestAlt = (filename: string): string =>
  filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
