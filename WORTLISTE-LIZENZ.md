# Wortliste für „Diese Wörter bleiben stehen“ (seit Version 2.9.0)

| | |
|---|---|
| Paket | [all-the-german-words](https://www.npmjs.com/package/all-the-german-words) |
| Version | **1.1.0** (fest in `package.json` und `package-lock.json`, Prüfsumme `sha512-watOO5w6G1ZYeDhmIzNTtm4Kdw2tQYHKdOhnXvPhCtvKX09QOo3CONUpYlc7NWzlW2YGSBqXRw8GHYchC5eghg==`) |
| Lizenz | **MIT** (Angabe in der `package.json` des Pakets) |
| Urheber | „CreativeCouple, zeke“ (Feld `author` der `package.json` des Pakets) |
| Herkunft der Wörter (laut Paket) | deutsches Wiktionary und die Letterpress-Wortliste (atebits/Words) |
| Genutzt | **nur die Daten** aus `woerter.json` (rund 1,68 Mio. Wortformen); kein Code des Pakets wird ausgeführt oder eingebettet; installiert mit `--ignore-scripts` |
| Verarbeitung | `build/build-woerter.mjs`: nur Wörter aus Buchstaben mit mindestens 3 Zeichen, kleingeschrieben und in der Vergleichsform des Tools, sortiert, vorne zusammengefasst, gepackt (deflate, pako aus `package-lock.json`), base64 – als Datenblock in `index.html` |

Hinweis: Das Paket enthält **keine eigene Lizenzdatei**, nur die Angabe „MIT“ in seiner `package.json`. Der folgende Text
ist der übliche MIT-Lizenztext mit den Urhebern aus dieser Angabe.

```
MIT License

Copyright (c) CreativeCouple, zeke

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
