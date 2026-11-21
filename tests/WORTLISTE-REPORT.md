# Wortliste „mehrdeutig“ und Wochentag vor Uhrzeit (Version 2.4.0): Tests

Liste (57 Wörter): amen, apollo, arena, atlas, aura, bares, bars, blick, buddha, campus, cola, delta, dock, dolch, faktor, frauen, gala, harter, hort, inder, jazz, judin, kalender, kardinal, kita, klemme, krabbe, lama, landen, lava, liga, los, machtig, mama, manns, monde, papa, patrone, perle, pole, pop, raucher, reale, reine, schimmer, schlangen, skala, soda, spinner, tat, termine, tode, treff, truben, volle, wale, yoga

## Einzelprüfungen (vorher = 2.3.4, nachher = diese Version)
- „Die Kita Freie Waldorfschule lädt ein.“: vorher Kita Freie (sicher, an); nachher Kita (unsicher, aus)
- OK: „Die Kita Freie Waldorfschule lädt ein.“: kein Personentreffer „Kita Freie“ mehr
- „Yoga für Anfänger“: vorher Yoga (sicher, an); nachher Yoga (unsicher, an)
- OK: „Yoga für Anfänger“: „Yoga“ nicht mehr „sicher“
- „Der Handball-Campus beginnt um 10 Uhr.“: vorher Handball-Campus (sicher, an); nachher kein Personentreffer
- OK: „Der Handball-Campus beginnt um 10 Uhr.“: „Handball-Campus“ nicht mehr „sicher“
- „Do 13:30 Uhr Elterncafé“: vorher Do (unsicher, aus); nachher kein Personentreffer
- OK: „Do 13:30 Uhr Elterncafé“: kein Treffer
- „Mo 05.10. Ausflug zum Bauernhof“: vorher kein Personentreffer; nachher kein Personentreffer
- OK: „Mo 05.10. Ausflug zum Bauernhof“: kein Treffer
- „Do. 13:30 Uhr Elterncafé“: vorher Do (unsicher, aus, Regel b2); nachher Do (unsicher, aus, Regel b2)
- OK: „Do. 13:30 Uhr Elterncafé“: mit Punkt weiter Regel b2 (unsicher, aus)
- „Frau Do kommt um 13:30.“: vorher Do (sicher, an); nachher Do (sicher, an)
- OK: „Frau Do kommt um 13:30.“: echte Person nach Anrede bleibt ersetzt
- „Frau Do 13:30 Uhr“: vorher Do (sicher, an); nachher Do (sicher, an)
- OK: „Frau Do 13:30 Uhr“: echte Person nach Anrede vor Uhrzeit bleibt ersetzt

## Zusammenspiel
- Regel a2, „Herr“ ⏎ „Yoga“: vorher Yoga (sicher, an, Regel a2); nachher Yoga (unsicher, an)
- OK: Regel a2: „Yoga“ nach allein stehender Anrede bleibt ersetzt
- Regel a2, „Herr“ ⏎ „Kita“: vorher Kita (sicher, an, Regel a2); nachher Kita (unsicher, an)
- OK: Regel a2: „Kita“ nach allein stehender Anrede bleibt ersetzt
- Regel a2, „Herr“ ⏎ „Mama“: vorher Mama (sicher, an, Regel a2); nachher Mama (unsicher, an)
- OK: Regel a2: „Mama“ nach allein stehender Anrede bleibt ersetzt
- Regel a2, „Herr“ ⏎ „Kalender“: vorher Kalender (sicher, an, Regel a2); nachher Kalender (unsicher, an)
- OK: Regel a2: „Kalender“ nach allein stehender Anrede bleibt ersetzt
- Regel a2, „Herr“ ⏎ „Campus“: vorher Campus (sicher, an, Regel a2); nachher Campus (unsicher, an)
- OK: Regel a2: „Campus“ nach allein stehender Anrede bleibt ersetzt
- Einrichtung „Freie Waldorfschule“: Treffer vorher „Freie Waldorfschule“, nachher „Freie Waldorfschule“; Schlusscheck Einrichtung vorher Freie⏎Waldorfschule, nachher Freie⏎Waldorfschule; Personen vorher Kita Freie (sicher, an), nachher Kita (unsicher, an)
- OK: Einrichtungen: Vorrang und Schlusscheck für „Freie Waldorfschule“ unverändert
- Übertragung „Kalender“: vorher Felix Kalender (sicher, an); Kalenders (sicher, an); KALENDER (sicher, an); KALENDERS (sicher, an); nachher Felix Kalender (sicher, an); Kalenders (unsicher, an); KALENDER (unsicher, an); KALENDERS (unsicher, an)
- OK: Endungs-/Großformen von „Kalender“: keine Übertragung entfällt, alles bleibt ersetzt
- Übertragung „Yoga“: vorher Felix Yoga (sicher, an); Yogas (sicher, an); Akte YOGA (unsicher, an); YOGAS (sicher, an); nachher Felix Yoga (sicher, an); Yogas (unsicher, an); YOGA (unsicher, an); YOGAS (unsicher, an)
- OK: Endungs-/Großformen von „Yoga“: keine Übertragung entfällt, alles bleibt ersetzt
- Übertragung „Pole“: vorher Felix Pole (sicher, an); Poles (sicher, an); Akte POLE (unsicher, an); nachher Felix Pole (sicher, an); Poles (unsicher, an); POLE (unsicher, an)
- OK: Endungs-/Großformen von „Pole“: keine Übertragung entfällt, alles bleibt ersetzt
- OK: Jedes Wort der Liste steht in einer Namensliste

Prüfungen: 18 von 18 bestanden.
