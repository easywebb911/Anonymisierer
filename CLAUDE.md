# Anonymisierer – Regeln für Claude

## Meldungen
- Keine Zwischenstände. Wartest du auf einen Lauf, schreibst du nur das Wort „läuft“.
- Jede andere Meldung beginnt mit genau einer Zeile: `FERTIG – Bericht vollständig.` oder `WARTE AUF EASY – <Frage in einem Satz>`. Diese Wörter stehen sonst nirgends im Text.
- Antwortet Easy nur „Status?“, gibst du nur „läuft“ zurück (oder die passende erste Zeile) und arbeitest weiter.

## Tests
- Kein Vorher-Lauf mehr: Der Stand von main steht in `tests/STAND.md`.
- Während der Arbeit nur `npm run test:quick -- <Namen>` mit den betroffenen Läufen; `npm run test:all` genau einmal auf dem Endstand.
- Ergebnisse alter Versionen liegen in `tests/referenz/` und werden nicht neu gerechnet (`ANON_REF=pruefen` vergleicht gespeichert mit frisch).

## Guardian
- Ein Lauf je PR, Zeitgrenze 20 Minuten. Er prüft nur, was der Auftrag ändert. Er bekommt den Auftragstext, den Diff gegen main, die index.html des Branches und die von main, aber nicht deine Begründungen.
- Alle Funde stehen **wörtlich** im Bericht an Easy.
- Verursacht der PR selbst ein Leck oder einen Fehler, behebst du es, und der Guardian läuft ein zweites und letztes Mal. Alles andere (alte Fehler, Hinweise) steht wörtlich im Bericht und wird nicht mitgebaut.
- Findet auch der zweite Lauf ein selbst verursachtes Leck: nicht weiterbauen, `WARTE AUF EASY`.
- Ändert ein Auftrag weder `src/` noch `index.html`, braucht er keinen Guardian-Lauf.
- Sein Urteil ist ein **Rat, keine Sperre**. Die Entscheidung trifft Easy. Scheitert der Lauf technisch: einmal neu starten, sonst im Bericht melden.

## Feste Projektregeln
- Das Tool bleibt **strikt offline** und **eine einzelne index.html**.
- In Tests und Berichten stehen **nur erfundene Namen**.
- Du liest, klonst oder fetchst **nie ein anderes Repo**.
- Es gibt **einen PR zur Zeit**.
- **Ein Thema je Auftrag.**
- Änderungen an **Erkennungs-, Platzhalter- oder Schlüssel-Logik** sind **Manual-Merge**: Easy mergt selbst.
- **GitHub-Rate-Limit:** kein Retry, sofort melden.
- **Mini-Stopp statt Raten:** Ist etwas unklar oder widersprüchlich, hältst du an und meldest es.
- Zu jedem neuen Schalter und jeder neuen Regel gehört ein Test mit 'Unsichere Treffer' aus.
