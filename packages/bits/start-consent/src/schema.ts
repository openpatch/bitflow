import { z } from "zod";

export const DataSchema = z.object({
  title: z.string().default(""),
  /** What is recorded, why, and who sees it. */
  markdown: z.string().default(""),
  /** The wording beside the tick box. */
  agreeLabel: z.string().default(""),
  /**
   * Shown while the box is unticked, next to a Next that will not move.
   *
   * The learner has to be told why the button is dead. A disabled control with
   * no reason beside it is the whole reason people click twice and give up.
   */
  requiredHint: z.string().default(""),
  /**
   * Offer a way to say no.
   *
   * Consent that cannot be refused is not consent. When this is on the answer
   * carries `agreed: false` and the step is complete, so a connection can send
   * them somewhere else — an alternative route, or straight to an end. When it
   * is off the only way on is to agree, which is honest for an assessment that
   * genuinely cannot run otherwise, and the author should say so in the text.
   */
  allowDecline: z.boolean().default(true),
  declineLabel: z.string().default(""),
});
export type Data = z.infer<typeof DataSchema>;

/**
 * What the learner decided: `true` for yes, `false` for no, `undefined` until
 * they have said either way.
 *
 * A bare boolean rather than `{ agreed: boolean }`, which is what it was at
 * first. The shape matters because it is what a branch has to compare: a bare
 * answer is `{ kind: "answer", nodeId }`, which the editor can offer as "the
 * learner's answer to this step is No". Wrapped in an object it needed a dot
 * path, the editor had no way to build one, and the branch this bit exists for
 * could only be written by hand in the file. `task-yes-no` stores its answer
 * the same way for the same reason.
 */
export type Answer = boolean;

/**
 * They have made a choice — not that they said yes.
 *
 * Declining is a complete answer, and the flow decides what follows from it.
 * Without a way to decline there is only one complete answer, which is what
 * makes the tick box mean something rather than decorate the page.
 */
export const isDecided = (data: Data, answer: Answer | undefined): boolean =>
  answer === true || (data.allowDecline && answer === false);
