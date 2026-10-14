CookIt – Windows-Version (64 Bit)



**Starten mit Visual Studio Code:**



1\. ZIP entpacken und den Ordner `cookit` in VS Code öffnen.

2\. Node.js ab Version 18 muss installiert sein.

3\. Im Terminal `npm start` oder `node server.js` eingeben.

4\. Im Browser http://localhost:3000 öffnen oder auf den im Terminal ausgegebenen Link klicken.

5\. Zum Beenden im Terminal Strg+C drücken.

6\. Keine Paketinstallation nötig: Der Server verwendet ausschließlich integrierte Node.js-Module. Die HTML-Datei nicht direkt per Doppelklick öffnen; die Speicherfunktionen benötigen den Server.



**Starten mit der .exe:**

1\. Die gesamte ZIP-Datei entpacken.

2\. Im Ordner windows CookIt.exe doppelt anklicken.

3\. CookIt öffnet sich im Standardbrowser. Node.js und npm sind nicht erforderlich.

4\. Das schwarze Startfenster geöffnet lassen. Zum Beenden schließen oder Strg+C drücken.



Die EXE enthält den lokalen Server, die Oberfläche und die Beispieldaten.

Es ist kein Installer; die App wird lokal ausgeführt. Die EXE ist nicht digital signiert.

## Funktionen
- Rezepte anlegen, bearbeiten, löschen und dauerhaft in `data/recipes.json` speichern.
- Mehrere Zutaten und Mengen; Einheiten als Dropdown: g, dg, kg, ml, l, Stück, Prise, Pak.
- Allergene als aufklappbare Mehrfachauswahl mit den 14 Gruppen aus Anhang II der EU-Verordnung 1169/2011.
- Zubereitung, Dauer, Ernährungsart und Favoriten.
- Skalierung über gewünschte Portionen oder die Menge einer einzelnen Zutat.
- Druckansicht der skalierten Zutaten und Nährwerte.
- Suche nach Rezept / Zutat, Ernährungsart, Allergenausschluss, Favoriten; Sortierung nach Datum und allen vier Nährwerten.
- Hell-/Dunkelmodus und Schriftgröße.
- Tagesziele und konsumierte Mahlzeiten aus Rezepten oder manueller Eingabe; Vorschläge aus derselben Rezeptsammlung.

## Nährwerte
Optionale manuelle Eingabe **pro Portion**, auch einzelne Felder dürfen leer bleiben. Unbekannt ist nicht null kcal, sondern „—“. Die Werte der Gesamtmenge werden mit der gewünschten Portionszahl multipliziert. Die Nährwerte einer Portion bleiben bei proportionaler Skalierung gleich. Keine externe Datenbank und keine automatische Berechnung aus Zutaten.

Für den Mahlzeiten-Optimierer werden nur Rezepte mit allen vier Angaben verwendet. Seine Bewertung folgt dem ursprünglichen Algorithmus: Summe der absoluten relativen Abweichungen nach einer zusätzlichen Portion zu kcal, Protein, Kohlenhydraten und Fett. Alle Ziele müssen > 0 sein. Das ist ein nachvollziehbarer Vergleichsalgorithmus, keine KI und keine Ernährungsberatung. Verbrauchte Mahlzeiten und Tagesziele sind temporär und werden beim Neuladen zurückgesetzt; Rezeptdaten bleiben gespeichert. Nur Darstellungseinstellungen liegen im Browser.

## Beispieldaten
Die sechs Startrezepte sind Demonstrationsdaten. Nährwerte der ersten fünf stammen aus der angehängten Optimierer-Datei; Zutaten und Anleitungen wurden als Beispiele ergänzt und sind **nicht** Grundlage einer nachgerechneten Nährwertanalyse. Ofengemüse demonstriert ein Rezept ohne Nährwerte.

## Aufbau
- `server.js`: HTTP-Server, CRUD-API und Validierung; atomare JSON-Dateischreibung mit serieller Schreibwarteschlange.
- `public/index.html`: zugängliche Formulare, Rezeptansicht, Optimierer.
- `public/style.css`: responsive Oberfläche und Drucklayout.
- `public/app.js`: UI, Filter, Skalierung und Vorschlagsberechnung.
- `data/recipes.json`: zentrale dauerhafte Rezeptdaten.
- `test.js`: API-Integrationstest; `npm test`.
- `original/`: unveränderte Ausgangsdateien inklusive Anforderungsdokument.

WICHTIG: EIGENE REZEPTE

Die EXE speichert deine Rezepte dauerhaft unter:

%LOCALAPPDATA%\\CookIt\\data\\recipes.json



Der ursprüngliche Quellcode-Modus(starten über VSCode) speichert dagegen im Projektordner unter data\\recipes.json.

Diese beiden Dateien werden nicht automatisch synchronisiert.



Bestehende Rezepte in die .exe übernehmen:

\- CookIt.exe einmal starten und danach das Startfenster schließen.

\- Die bisherige eigene data\\recipes.json sichern.

\- Im Explorer %LOCALAPPDATA%\\CookIt\\data öffnen.

\- Die dortige recipes.json sichern und durch die eigene Datei ersetzen.

\- CookIt.exe wieder starten.





GitHub workflow test.


Änderung auf GitHub -> Pull testen.

Push auf GitHub -> Push testen.

Branch erstellen und Pull testen -> Pull testen.