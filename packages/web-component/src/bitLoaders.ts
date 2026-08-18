import { hasBit } from "@bitflow/core";

/**
 * The one lazy-loading mechanism, shared by every element that needs a bit.
 *
 * A static map of `type` to `() => import(...)`, written out literally so a
 * bundler can see each import and give it its own chunk. A computed specifier
 * (`import("@bitflow/" + type)`) would defeat that and pull every bit into one
 * file, which is the whole thing this exists to avoid.
 *
 * Importing a bit package is what registers it *and* defines its standalone
 * custom element, so this function is the same operation a page performs by
 * hand with one `<script>` — there is no separate code path for either.
 */
export const bitLoaders: Record<string, () => Promise<unknown>> = {
  "start-simple": () => import("@bitflow/start-simple"),
  "end-tries": () => import("@bitflow/end-tries"),
  "title-simple": () => import("@bitflow/title-simple"),
  "input-markdown": () => import("@bitflow/input-markdown"),
  "task-choice": () => import("@bitflow/task-choice"),
  "task-yes-no": () => import("@bitflow/task-yes-no"),
  "task-input": () => import("@bitflow/task-input"),
  "task-fill-in-the-blank": () => import("@bitflow/task-fill-in-the-blank"),
  "task-highlighting": () => import("@bitflow/task-highlighting"),
  "task-drag-drop": () => import("@bitflow/task-drag-drop"),
  "task-find-hotspots": () => import("@bitflow/task-find-hotspots"),
  "task-ordering": () => import("@bitflow/task-ordering"),
  "task-matching": () => import("@bitflow/task-matching"),
  "task-parsons": () => import("@bitflow/task-parsons"),
};

export const KNOWN_BIT_TYPES = Object.keys(bitLoaders);

/**
 * Loads the bits `types` names, skipping any already registered.
 *
 * Returns the types it could not load — a document may legitimately reference
 * a bit this build knows nothing about, and the caller decides whether that is
 * an error to report or a node to render as "unavailable".
 */
export const loadBits = async (types: Iterable<string>): Promise<string[]> => {
  const missing: string[] = [];
  const pending: Array<Promise<unknown>> = [];

  for (const type of new Set(types)) {
    if (hasBit(type)) continue;
    const load = bitLoaders[type];
    if (!load) {
      missing.push(type);
      continue;
    }
    pending.push(
      load().catch(() => {
        // A chunk that fails to arrive (offline, bad deploy) is reported the
        // same way as an unknown type: the learner sees which task is missing
        // rather than a blank screen.
        missing.push(type);
      }),
    );
  }

  await Promise.all(pending);
  return missing;
};

/** Every bit, for the editor's palette. An author needs the full set. */
export const loadAllBits = (): Promise<string[]> => loadBits(KNOWN_BIT_TYPES);

/** The distinct bit types a document references. */
export const bitTypesIn = (flow: unknown): string[] => {
  const nodes = (flow as { nodes?: Array<{ type?: unknown }> })?.nodes;
  if (!Array.isArray(nodes)) return [];
  return [
    ...new Set(
      nodes
        .map((node) => node?.type)
        .filter((type): type is string => typeof type === "string"),
    ),
  ];
};
