# Scheikunde oefenen – hoofdstuk 3 (3 havo, Chemie Overal)

Oefenapp voor leerlingen met twee onderdelen:

- **Reactievergelijkingen kloppend maken**: 51 reacties op drie niveaus.
- **Systematische naamgeving**: van formule naar naam en andersom. Er zijn vier soorten stoffen: moleculaire stoffen met telwoorden, elementen, twee-atomige stoffen en triviale namen.

Na elke vraag ziet de leerling of het antwoord goed was, wat het juiste antwoord is en de uitwerking in stappen. Een periodiek systeem kan open blijven terwijl je een vraag maakt.

Vragen met alleen niet-metalen komen ongeveer 4× zo vaak voor als vragen met metalen (instelbaar met `NONMETAL_WEIGHT` in `js/data.js`).

Scores en de geschiedenis van alle rondes worden automatisch opgeslagen in de browser (`localStorage`), zonder in te loggen of een naam in te vullen. Op de pagina *Geschiedenis* kun je een back-up exporteren en weer importeren.

## Online zetten met GitHub Pages

1. Push deze bestanden naar de `main`-branch.
2. Ga op GitHub naar **Settings → Pages**.
3. Kies bij *Source* **Deploy from a branch**, met branch `main` en map `/ (root)`.
4. Na ongeveer een minuut staat de site op `https://<gebruikersnaam>.github.io/scheikunde-reactievergelijkingen-oefeningen/`.

Er is geen build-stap nodig: het is gewone HTML, CSS en JavaScript.

## Aanpassen

| Wat | Waar |
|---|---|
| Kleuren | variabelen bovenaan [`css/style.css`](css/style.css) |
| Reacties | `REACTIONS` in [`js/data.js`](js/data.js) (`c` = coëfficiënten, gebruik de kleinste gehele getallen) |
| Moleculaire stoffen | `MOLECULAR` in `js/data.js`; de naam en de uitwerking worden automatisch gemaakt |
| Triviale namen / elementen | `TRIVIAL` en `COMMON_ELEMENTS` in `js/data.js` |

Lokaal testen: open `index.html` gewoon in de browser.
