import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  markdown: z.string().default(""),
  /**
   * Tell the page around this one that the run is finished, by posting the
   * attempt to it.
   *
   * For bitflow embedded in something else — a course page, an LMS — where the
   * host is the thing that keeps the result. bitflow has no server of its own,
   * so this is the moment the attempt leaves the tab.
   */
  postMessage: z.boolean().default(false),
  /**
   * Exactly which page may receive it, as an origin: `https://school.example`.
   *
   * Never `*`. A wildcard target hands a learner's whole attempt — every
   * answer, every explanation they typed — to whatever page happens to have
   * framed this one, and the browser will not warn anybody. With no origin set
   * the bit posts nothing and says so.
   */
  messageOrigin: z.string().default(""),
  /**
   * Where they go next. Shown as an ordinary link, and only when it is one:
   * see `isFollowableUrl`.
   */
  continueUrl: z.string().default(""),
  continueLabel: z.string().default(""),
});
export type Data = z.infer<typeof DataSchema>;

/** The message this bit posts. Named so a host can tell it from anything else. */
export const MESSAGE_TYPE = "bitflow:attempt";

/**
 * Whether the attempt may be sent to `origin`.
 *
 * An exact `scheme://host[:port]`, and nothing else. `*` is rejected outright
 * rather than passed to `postMessage`, which would accept it happily — that is
 * the whole hazard. Anything unparseable, or carrying a path, is a typo, and a
 * typo must fail loudly here rather than deliver somewhere unintended.
 */
export const isSendableOrigin = (origin: string): boolean => {
  const trimmed = origin.trim();
  if (trimmed === "" || trimmed === "*") return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return url.origin === trimmed.replace(/\/$/, "");
  } catch {
    return false;
  }
};

/**
 * Whether `continueUrl` may be rendered as a link.
 *
 * A document is fetched from wherever the host points `<bitflow-flow src>`, and
 * `parseFlow` deliberately does not check a bit's `data` — so this address is
 * whatever the file says. `javascript:` in an `href` runs in the page that
 * drew it, with the learner's whole attempt in reach, which is exactly the
 * hazard `Markdown` already refuses for a link written in prose. A link the
 * author typed by hand deserves the same treatment.
 *
 * Relative addresses are allowed: they resolve against the page and cannot
 * carry a scheme of their own.
 */
export const isFollowableUrl = (url: string): boolean => {
  const trimmed = url.trim();
  if (trimmed === "") return false;
  try {
    // A base only so a relative address parses; the scheme is what is checked.
    const resolved = new URL(trimmed, "https://bitflow.invalid/");
    return resolved.protocol === "https:" || resolved.protocol === "http:";
  } catch {
    return false;
  }
};
