import type { Catalogs } from "@bitflow/core";

/**
 * What the learner reads. Every locale complete — see `formMessages.ts` for
 * the authoring labels, which are English and German only.
 */
export const messages: Catalogs = {
  en: {
    name: "Finish and hand back",
    description:
      "Closing screen that returns the finished attempt to the page around it.",
    continueFallback: "Continue",
    sending: "Sending your work…",
    sent:
      "Your work has been sent to the page around this one. If nothing happens next, tell your teacher — it is still here until you close this tab.",
    failed: "Your work could not be sent.",
    retry: "Try sending again",
    misconfigured:
      "This assessment is not set up to send anywhere. Tell whoever set it — your work is safe in this tab until you close it.",
    unframed:
      "This page is not inside anything to send to, so your work has not gone anywhere. Tell whoever set it — your work is safe in this tab until you close it.",
  },
  de: {
    name: "Fertig und zurückgeben",
    description:
      "Abschluss-Bildschirm, der den fertigen Versuch an die umgebende Seite zurückgibt.",
    continueFallback: "Weiter",
    sending: "Deine Arbeit wird gesendet …",
    sent:
      "Deine Arbeit wurde an die umgebende Seite gesendet. Wenn danach nichts passiert, sag deiner Lehrkraft Bescheid — sie bleibt hier, bis du den Tab schließt.",
    failed: "Deine Arbeit konnte nicht gesendet werden.",
    retry: "Noch einmal senden",
    misconfigured:
      "Dieser Test ist nicht zum Senden eingerichtet. Sag der Person Bescheid, die ihn gestellt hat — deine Arbeit bleibt in diesem Tab, bis du ihn schließt.",
    unframed:
      "Diese Seite ist in nichts eingebettet, an das gesendet werden könnte — deine Arbeit ist also nirgendwo hingegangen. Sag der Person Bescheid, die den Test gestellt hat — deine Arbeit bleibt in diesem Tab, bis du ihn schließt.",
  },
  fr: {
    name: "Terminer et transmettre",
    description:
      "Écran final qui renvoie la tentative terminée à la page qui l'entoure.",
    continueFallback: "Continuer",
    sending: "Envoi de votre travail…",
    sent:
      "Votre travail a été envoyé à la page qui entoure celle-ci. Si rien ne se passe ensuite, prévenez votre enseignant — il reste ici jusqu'à la fermeture de cet onglet.",
    failed: "Votre travail n'a pas pu être envoyé.",
    retry: "Réessayer l'envoi",
    misconfigured:
      "Cette évaluation n'est configurée pour envoyer nulle part. Prévenez la personne qui l'a préparée — votre travail reste dans cet onglet jusqu'à sa fermeture.",
    unframed:
      "Cette page n'est intégrée à rien vers quoi envoyer : votre travail n'est donc allé nulle part. Prévenez la personne qui l'a préparée — votre travail reste dans cet onglet jusqu'à sa fermeture.",
  },
  nl: {
    name: "Klaar en teruggeven",
    description:
      "Slotscherm dat de afgeronde poging teruggeeft aan de omringende pagina.",
    continueFallback: "Verder",
    sending: "Je werk wordt verstuurd…",
    sent:
      "Je werk is naar de omringende pagina verstuurd. Gebeurt er daarna niets, zeg het dan tegen je docent — het blijft hier tot je dit tabblad sluit.",
    failed: "Je werk kon niet worden verstuurd.",
    retry: "Opnieuw versturen",
    misconfigured:
      "Deze toets is niet ingesteld om iets te versturen. Zeg het tegen wie hem heeft klaargezet — je werk blijft in dit tabblad tot je het sluit.",
    unframed:
      "Deze pagina zit nergens in waarnaar verstuurd kan worden, dus je werk is nergens heen gegaan. Zeg het tegen wie de toets heeft klaargezet — je werk blijft in dit tabblad tot je het sluit.",
  },
  es: {
    name: "Terminar y entregar",
    description:
      "Pantalla final que devuelve el intento terminado a la página que lo rodea.",
    continueFallback: "Continuar",
    sending: "Enviando tu trabajo…",
    sent:
      "Tu trabajo se ha enviado a la página que rodea esta. Si después no pasa nada, avisa a tu profesor: sigue aquí hasta que cierres esta pestaña.",
    failed: "No se pudo enviar tu trabajo.",
    retry: "Intentar enviarlo otra vez",
    misconfigured:
      "Esta evaluación no está configurada para enviar nada. Avisa a quien la preparó: tu trabajo sigue en esta pestaña hasta que la cierres.",
    unframed:
      "Esta página no está dentro de nada a lo que enviar, así que tu trabajo no ha ido a ninguna parte. Avisa a quien la preparó: tu trabajo sigue en esta pestaña hasta que la cierres.",
  },
  it: {
    name: "Fine e consegna",
    description:
      "Schermata finale che restituisce il tentativo concluso alla pagina che lo contiene.",
    continueFallback: "Continua",
    sending: "Invio del tuo lavoro…",
    sent:
      "Il tuo lavoro è stato inviato alla pagina che contiene questa. Se poi non succede nulla, dillo all'insegnante: resta qui finché non chiudi questa scheda.",
    failed: "Non è stato possibile inviare il tuo lavoro.",
    retry: "Prova a inviare di nuovo",
    misconfigured:
      "Questa verifica non è impostata per inviare nulla. Dillo a chi l'ha preparata: il tuo lavoro resta in questa scheda finché non la chiudi.",
    unframed:
      "Questa pagina non è dentro nulla a cui inviare, quindi il tuo lavoro non è andato da nessuna parte. Dillo a chi l'ha preparata: il tuo lavoro resta in questa scheda finché non la chiudi.",
  },
  pt: {
    name: "Terminar e entregar",
    description:
      "Ecrã final que devolve a tentativa concluída à página que a contém.",
    continueFallback: "Continuar",
    sending: "A enviar o teu trabalho…",
    sent:
      "O teu trabalho foi enviado para a página que contém esta. Se depois não acontecer nada, diz ao teu professor — fica aqui até fechares este separador.",
    failed: "Não foi possível enviar o teu trabalho.",
    retry: "Tentar enviar outra vez",
    misconfigured:
      "Este teste não está preparado para enviar nada. Diz a quem o preparou — o teu trabalho fica neste separador até o fechares.",
    unframed:
      "Esta página não está dentro de nada para onde enviar, por isso o teu trabalho não foi para lado nenhum. Diz a quem o preparou — o teu trabalho fica neste separador até o fechares.",
  },
  tr: {
    name: "Bitir ve teslim et",
    description:
      "Tamamlanan denemeyi çevresindeki sayfaya geri veren kapanış ekranı.",
    continueFallback: "Devam",
    sending: "Çalışman gönderiliyor…",
    sent:
      "Çalışman bu sayfayı çevreleyen sayfaya gönderildi. Sonrasında bir şey olmazsa öğretmenine söyle — bu sekmeyi kapatana kadar burada duruyor.",
    failed: "Çalışman gönderilemedi.",
    retry: "Yeniden göndermeyi dene",
    misconfigured:
      "Bu değerlendirme bir yere gönderecek şekilde ayarlanmamış. Hazırlayan kişiye söyle — çalışman sekmeyi kapatana kadar burada duruyor.",
    unframed:
      "Bu sayfa gönderilebilecek bir sayfanın içinde değil, bu yüzden çalışman hiçbir yere gitmedi. Hazırlayan kişiye söyle — çalışman sekmeyi kapatana kadar burada duruyor.",
  },
};
