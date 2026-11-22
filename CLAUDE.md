# Anonymisierer – Regeln für Claude

## Guardian-Pflichtlauf
- Vor **jeder Fertig-Meldung** und vor **jedem Merge** startest du den Guardian (`.claude/agents/anonymisierer-guardian.md`) auf dem fertigen Stand. Er bekommt den Auftragstext, den Diff gegen main, die index.html des Branches und die von main, aber nicht deine Begründungen.
- Alle Funde des Guardians stehen **wörtlich** im Bericht an Easy. Jeden Fund behebst du oder begründest, warum nicht.
- Behebst du etwas, läuft der Guardian danach **noch einmal**.
- Sein Urteil ist ein **Rat, keine Sperre**. Die Entscheidung trifft Easy.
- Scheitert der Guardian-Lauf technisch: einmal neu starten, sonst im Bericht melden, nicht verschweigen.
- **Ausnahme:** Reine Diagnose ohne Änderung braucht keinen Guardian.

## Feste Projektregeln
- Das Tool bleibt **strikt offline** und **eine einzelne index.html**.
- In Tests und Berichten stehen **nur erfundene Namen**.
- Du liest, klonst oder fetchst **nie ein anderes Repo**.
- Es gibt **einen PR zur Zeit**.
- Änderungen an **Erkennungs-, Platzhalter- oder Schlüssel-Logik** sind **Manual-Merge**: Easy mergt selbst.
- **GitHub-Rate-Limit:** kein Retry, sofort melden.
- **Mini-Stopp statt Raten:** Ist etwas unklar oder widersprüchlich, hältst du an und meldest es.
