import type { Catalogs } from "@bitflow/core";

/**
 * Learner-facing strings and the palette entry. The authoring form's labels
 * live in `formMessages.ts`, so each catalog can be complete in the languages
 * it declares.
 */
export const messages: Catalogs = {
  en: {
    name: "Graph path",
    description:
      "A graph, and a route, traversal order, spanning tree or cut to pick out of it.",
    howToRoute:
      "Build the route by choosing one place after another, starting at {source} and finishing at {target}. Click a place in the diagram, or use the buttons below it.",
    howToTraversal:
      "Give the order the search visits the places in, starting at {source}. Click a place in the diagram, or use the buttons below it.",
    howToTree:
      "Choose the connections that join every place up as cheaply as possible. Click a connection in the diagram, or tick it in the list.",
    howToCut:
      "Choose the places that stay on {source}'s side once the cheapest set of connections is cut, leaving {target} on the other side.",
    howToReadonly: "The answer is shown as it was left.",
    tieLabel: "Where there is a choice, the search takes neighbours in alphabetical order.",
    tieAuthored:
      "Where there is a choice, the search takes neighbours in the order the connections are drawn.",
    diagramLabel: "Diagram of the graph. It is written out in full below.",
    writtenOut: "The graph, written out",
    joinedTo: "{place} joins {neighbours}.",
    joinedToNothing: "{place} joins nothing.",
    leadsTo: "{place} leads to {neighbours}.",
    leadsToNothing: "{place} leads nowhere.",
    withWeight: "{place} ({weight})",
    chosenRoute: "Your route",
    chosenOrder: "Your order",
    chosenSide: "On {source}'s side",
    chosenEdges: "Chosen connections",
    nothingChosen: "Nothing chosen yet.",
    addPlace: "Add {place}",
    placesLabel: "Places",
    connectionsLabel: "Connections",
    edgePlain: "{from} to {to}",
    edgeWeighted: "{from} to {to}, costing {weight}",
    sideOf: "{place} stays on {source}'s side",
    removeLast: "Remove the last",
    startAgain: "Start again",
    added: "{place} added, {count} chosen.",
    removed: "{place} removed, {count} chosen.",
    cleared: "Cleared.",
    start: "start",
    finish: "finish",
    correct: "correct",
    wrong: "wrong",
    reasonCorrect: "That works.",
    reasonEmpty: "Nothing was chosen.",
    reasonNotFromSource: "The route has to start at {source}.",
    reasonNotToTarget: "The route has to finish at {target}.",
    reasonBroken: "Two places in the route are not joined to each other.",
    reasonRepeats: "The route passes through the same place twice.",
    reasonNotShortest: "That route works, but there is a cheaper one.",
    reasonWrongOrder: "The order goes wrong part of the way through.",
    reasonMissesPlaces: "The order stops before every place has been visited.",
    reasonTreeWrongSize:
      "A tree joining {count} places needs exactly {edges} connections.",
    reasonTreeCycle: "Those connections go round in a circle.",
    reasonTreeDisconnected: "Those connections leave a place cut off.",
    reasonNotCheapestTree: "That joins everything up, but there is a cheaper way.",
    reasonNotSeparating:
      "The near side has to hold {source} and leave {target} on the far side.",
    reasonNotCheapestCut: "That separates them, but there is a cheaper cut.",
  },
  de: {
    name: "Graph und Weg",
    description:
      "Ein Graph und ein Weg, eine Besuchsreihenfolge, ein Spannbaum oder ein Schnitt daraus.",
    howToRoute:
      "Bau den Weg auf, indem du einen Ort nach dem anderen wählst — Start ist {source}, Ziel ist {target}. Klick einen Ort im Diagramm an oder nimm die Schaltflächen darunter.",
    howToTraversal:
      "Gib die Reihenfolge an, in der die Suche die Orte besucht, beginnend bei {source}. Klick einen Ort im Diagramm an oder nimm die Schaltflächen darunter.",
    howToTree:
      "Wähl die Verbindungen, die alle Orte so günstig wie möglich verbinden. Klick eine Verbindung im Diagramm an oder hak sie in der Liste ab.",
    howToCut:
      "Wähl die Orte, die auf der Seite von {source} bleiben, wenn die günstigste Menge an Verbindungen durchtrennt wird und {target} auf der anderen Seite liegt.",
    howToReadonly: "Die Antwort steht so, wie sie gelassen wurde.",
    tieLabel:
      "Wo es eine Wahl gibt, nimmt die Suche die Nachbarn in alphabetischer Reihenfolge.",
    tieAuthored:
      "Wo es eine Wahl gibt, nimmt die Suche die Nachbarn in der Reihenfolge der eingetragenen Verbindungen.",
    diagramLabel: "Diagramm des Graphen. Darunter steht er ausgeschrieben.",
    writtenOut: "Der Graph, ausgeschrieben",
    joinedTo: "{place} ist verbunden mit {neighbours}.",
    joinedToNothing: "{place} ist mit nichts verbunden.",
    leadsTo: "{place} führt zu {neighbours}.",
    leadsToNothing: "{place} führt nirgendwohin.",
    withWeight: "{place} ({weight})",
    chosenRoute: "Dein Weg",
    chosenOrder: "Deine Reihenfolge",
    chosenSide: "Auf der Seite von {source}",
    chosenEdges: "Gewählte Verbindungen",
    nothingChosen: "Noch nichts gewählt.",
    addPlace: "{place} hinzufügen",
    placesLabel: "Orte",
    connectionsLabel: "Verbindungen",
    edgePlain: "{from} nach {to}",
    edgeWeighted: "{from} nach {to}, Kosten {weight}",
    sideOf: "{place} bleibt auf der Seite von {source}",
    removeLast: "Letzten entfernen",
    startAgain: "Von vorn",
    added: "{place} hinzugefügt, {count} gewählt.",
    removed: "{place} entfernt, {count} gewählt.",
    cleared: "Zurückgesetzt.",
    start: "Start",
    finish: "Ziel",
    correct: "richtig",
    wrong: "falsch",
    reasonCorrect: "Das geht auf.",
    reasonEmpty: "Es wurde nichts gewählt.",
    reasonNotFromSource: "Der Weg muss bei {source} beginnen.",
    reasonNotToTarget: "Der Weg muss bei {target} enden.",
    reasonBroken: "Zwei Orte im Weg sind nicht miteinander verbunden.",
    reasonRepeats: "Der Weg kommt zweimal am selben Ort vorbei.",
    reasonNotShortest: "Dieser Weg geht, aber es gibt einen günstigeren.",
    reasonWrongOrder: "Die Reihenfolge geht unterwegs schief.",
    reasonMissesPlaces: "Die Reihenfolge hört auf, bevor alle Orte besucht sind.",
    reasonTreeWrongSize:
      "Ein Baum über {count} Orte braucht genau {edges} Verbindungen.",
    reasonTreeCycle: "Diese Verbindungen laufen im Kreis.",
    reasonTreeDisconnected: "Diese Verbindungen lassen einen Ort abgeschnitten.",
    reasonNotCheapestTree:
      "Das verbindet alles, aber es geht günstiger.",
    reasonNotSeparating:
      "Die nahe Seite muss {source} enthalten und {target} auf der anderen Seite lassen.",
    reasonNotCheapestCut: "Das trennt sie, aber es gibt einen günstigeren Schnitt.",
  },
};
