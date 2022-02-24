import { IResult, TaskBit } from "./types";

type AgreementMatrix = {
  agreeHighlight: number;
  agreeNoHighlight: number;
  disagreeHighlight: number;
  disagreeNoHighlight: number;
};

// https://shribe.de/cohens-kappa-berechnen/
export const kappa = ({
  agreeHighlight,
  agreeNoHighlight,
  disagreeHighlight,
  disagreeNoHighlight,
}: AgreementMatrix): number => {
  let N: number =
    agreeHighlight + disagreeHighlight + agreeNoHighlight + disagreeNoHighlight;
  let p0: number = (agreeHighlight + agreeNoHighlight) / N;
  let pe: number =
    (((agreeHighlight + disagreeHighlight) / N) *
      (agreeHighlight + disagreeNoHighlight)) /
      N +
    (((disagreeNoHighlight + agreeNoHighlight) / N) *
      (disagreeHighlight + agreeNoHighlight)) /
      N;

  let kappa: number = (p0 - pe) / (1 - pe);

  return kappa;
};

export const evaluate: TaskBit["evaluate"] = async ({ task, answer }) => {
  const evaluation = task.evaluation;

  let state: IResult["state"] = "unknown";
  const agreement = {
    maroon: 0,
    blue: 0,
    orange: 0,
    yellow: 0,
    lavender: 0,
  } as const;

  let highlightsFeedback: IResult["highlightsFeedback"] = new Array(
    task.view.text.length
  ).fill(null);

  if (evaluation.mode === "auto") {
    const highlightsA = answer?.highlights || [];
    const highlightsS = evaluation.highlights;

    Object.keys(agreement).forEach((c) => {
      const matrix: AgreementMatrix = {
        agreeNoHighlight: 0,
        agreeHighlight: 0,
        disagreeNoHighlight: 0,
        disagreeHighlight: 0,
      };

      for (let i = 0; i < task.view.text.length; i++) {
        const hA = highlightsA[i];
        const hS = highlightsS[i];

        if (hA === c && hS === c) {
          matrix.agreeHighlight += 1;
        } else if (hS === c && hA !== c) {
          matrix.disagreeHighlight += 1;
        } else if (hS !== c && hA === c) {
          matrix.disagreeNoHighlight += 1;
        } else if (hS !== c && hA !== c) {
          matrix.agreeNoHighlight += 1;
        }

        if (task.evaluation.showFeedback && task.feedback.highlightAgreement) {
          if (hA !== null && hA === hS) {
            highlightsFeedback[i] = "correct";
          } else if (hA !== null && hA !== hS) {
            highlightsFeedback[i] = "wrong";
          }
        }
      }

      agreement[c] = kappa(matrix);
    });

    state = "correct";
    Object.entries(task.view.colors).forEach(([k, v]) => {
      if (v.enabled && agreement[k] < task.evaluation.cutoffs[k]) {
        state = "wrong";
      }
    });
  } else if (evaluation.mode === "manual") {
    state = "manual";
  }

  return {
    state,
    subtype: "highlighting",
    allowRetry: task.evaluation.enableRetry,
    agreement,
    highlightsFeedback,
  };
};
