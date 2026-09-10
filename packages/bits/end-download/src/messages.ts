import type { Catalogs } from "@bitflow/core";

/**
 * What the learner reads. Every locale complete — see `formMessages.ts` for
 * the authoring labels, which are English and German only.
 */
export const messages: Catalogs = {
  en: {
    name: "Finish and save",
    description: "Closing screen that lets the learner save their attempt as a file.",
    downloadFallback: "Save your answers",
    hint: "The file is saved on this device. Nothing is sent anywhere.",
    unavailable: "There is nothing to save yet.",
    saved: "Saved as {filename}.",
    failed: "The file could not be saved.",
  },
  de: {
    name: "Fertig und speichern",
    description: "Abschluss-Bildschirm zum Speichern des Versuchs als Datei.",
    downloadFallback: "Antworten speichern",
    hint: "Die Datei wird auf diesem Gerät gespeichert. Es wird nichts verschickt.",
    unavailable: "Es gibt noch nichts zu speichern.",
    saved: "Als {filename} gespeichert.",
    failed: "Die Datei konnte nicht gespeichert werden.",
  },
  fr: {
    name: "Terminer et enregistrer",
    description: "Écran final permettant d'enregistrer la tentative dans un fichier.",
    downloadFallback: "Enregistrer vos réponses",
    hint: "Le fichier est enregistré sur cet appareil. Rien n'est envoyé.",
    unavailable: "Il n'y a encore rien à enregistrer.",
    saved: "Enregistré sous {filename}.",
    failed: "Le fichier n'a pas pu être enregistré.",
  },
  nl: {
    name: "Klaar en opslaan",
    description: "Slotscherm waarmee de poging als bestand kan worden opgeslagen.",
    downloadFallback: "Je antwoorden opslaan",
    hint: "Het bestand komt op dit apparaat te staan. Er wordt niets verstuurd.",
    unavailable: "Er is nog niets om op te slaan.",
    saved: "Opgeslagen als {filename}.",
    failed: "Het bestand kon niet worden opgeslagen.",
  },
  es: {
    name: "Terminar y guardar",
    description: "Pantalla final que permite guardar el intento como archivo.",
    downloadFallback: "Guardar tus respuestas",
    hint: "El archivo se guarda en este dispositivo. No se envía nada.",
    unavailable: "Todavía no hay nada que guardar.",
    saved: "Guardado como {filename}.",
    failed: "No se pudo guardar el archivo.",
  },
  it: {
    name: "Fine e salvataggio",
    description: "Schermata finale per salvare il tentativo in un file.",
    downloadFallback: "Salva le tue risposte",
    hint: "Il file viene salvato su questo dispositivo. Non viene inviato nulla.",
    unavailable: "Non c'è ancora niente da salvare.",
    saved: "Salvato come {filename}.",
    failed: "Non è stato possibile salvare il file.",
  },
  pt: {
    name: "Terminar e guardar",
    description: "Ecrã final que permite guardar a tentativa num ficheiro.",
    downloadFallback: "Guardar as tuas respostas",
    hint: "O ficheiro fica guardado neste dispositivo. Não é enviado nada.",
    unavailable: "Ainda não há nada para guardar.",
    saved: "Guardado como {filename}.",
    failed: "Não foi possível guardar o ficheiro.",
  },
  tr: {
    name: "Bitir ve kaydet",
    description: "Denemeyi dosya olarak kaydetmeyi sağlayan kapanış ekranı.",
    downloadFallback: "Yanıtlarını kaydet",
    hint: "Dosya bu cihaza kaydedilir. Hiçbir yere gönderilmez.",
    unavailable: "Henüz kaydedilecek bir şey yok.",
    saved: "{filename} olarak kaydedildi.",
    failed: "Dosya kaydedilemedi.",
  },
};
