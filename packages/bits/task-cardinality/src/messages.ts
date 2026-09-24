import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Cardinalities",
    description:
      "A diagram of entities and relationships whose ends the learner labels with cardinalities.",
    howTo: "Choose the cardinality at each end of every relationship. The diagram shows what you have chosen.",
    howToReadonly: "The cardinalities are shown as they were left.",
    diagramLabel: "Entity-relationship diagram",
    relationshipName: "{from} — {name} — {to}",
    endAt: "At {entity}",
    choose: "Choose…",
    correct: "correct",
    wrong: "wrong",
  },
  de: {
    name: "Kardinalitäten",
    description:
      "Ein Diagramm aus Entitäten und Beziehungen, dessen Beziehungsenden mit Kardinalitäten beschriftet werden.",
    howTo: "Wähle die Kardinalität an jedem Ende jeder Beziehung. Das Diagramm zeigt, was du gewählt hast.",
    howToReadonly: "Die Kardinalitäten stehen so, wie sie gelassen wurden.",
    diagramLabel: "Entity-Relationship-Diagramm",
    relationshipName: "{from} — {name} — {to}",
    endAt: "Bei {entity}",
    choose: "Wählen …",
    correct: "richtig",
    wrong: "falsch",
  },
};
