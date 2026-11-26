# COOCK Verspaningsatelier

Lokale Nederlandstalige workshopapp: onderzoek één draaibewerking en lever daarna een order binnen vijf gesimuleerde werkdagen. Werkt zelfstandig, zonder Sirris-data of verbinding met een echte machine.

## Lokaal openen

Gebruik Node.js 24. Voer vanuit de projectmap uit:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open het adres dat Vite toont. De browser voert de simulatie, import en exports zelf uit.

## GitHub Pages

Kies **GitHub Actions** onder **Settings → Pages → Build and deployment**.
De Pages-workflow bouwt en publiceert bij een push naar `codex/typescript-github-pages`
of `main`. Als de omgeving `github-pages` publicatie beperkt tot de standaardbranch,
sta dan de TypeScript-branch toe of publiceer na samenvoeging naar `main`.
De build gebruikt relatieve assetpaden en werkt onder het repositorypad.

## Bediening

Onder **01 Proef & productie** wissel je tussen **Proef voorbereiden** en **Resultaat beoordelen**. Wisselen bewaart je concept; simuleren opent de beoordeling. De knop **Proef instellingen** onder de reflectie kopieert de instellingen van het bekeken resultaat naar een nieuwe voorbereiding. Eerdere resultaten blijven behouden.

1. Kies de voormiddagproef of productieorder en lees de opdrachtkaart.
2. Voer de uitgangssituatie uit en bewaar ze als referentie.
3. Noteer een verwachting, wijzig gericht één instelling en voer opnieuw uit.
4. Vergelijk kwaliteit, kost per goed stuk en levering. Open de verdieping voor werkelijke synthetische kwaliteit tegenover gemeten kwaliteit.
   Kies voor de weekorder ook het vrijgavebeleid: steekproef laat onbevestigde stukken over; eindcontrole controleert onbekende stukken en vult gemeten tekorten aan zolang de week dit toelaat. Alleen gemeten goede stukken heten vrijgegeven.
5. Bewaar de volledige oefening als JSON. Open het bestand later opnieuw; de app herberekent en controleert de model- en scenarioversie. CSV bevat de stukken; de samenvatting is leesbare tekst.

De browser bewaart de oefening ook lokaal, gecomprimeerd. Een reeks bevat maximaal 12 proeven; bij een volle reeks blijft alles bewaard. Exporteer JSON en reset om een nieuwe reeks te beginnen. Gebruik JSON ook voor overdracht of langdurige bewaring. Wissen van browsergegevens verwijdert lokale opslag. Reset vraagt bevestiging.

De browserversie gebruikt model `2.0.0-browser.1` met een eigen toevalsreeks.
Python-proefbestanden komen uit een andere modelversie. Gebruik de browserversie
om nieuwe workshopbestanden te maken.

## Ontwikkeling en controle

```sh
npm --prefix frontend test
npm --prefix frontend run build
```

`frontend/src/process.ts` bevat de bewerkingsrelaties, `simulation.ts` de productie
en het rooster, en `scenarios/` de lesparameters. De afspeelsnelheid beïnvloedt
de simulatie niet.

Zie [model en bronnen](docs/MODEL.md), [workshophandleiding](docs/WORKSHOP.md) en [testverslag](docs/TEST_REPORT.md). Dit is een leeromgeving met illustratieve slijtage- en kwaliteitsparameters, geen gevalideerde snijparameteradviseur. Industriële toepassing vraagt metingen op eigen materiaal, gereedschap en machine.

Voor een latere proef met twee of drie echte deelnemers: [pilotprotocol](docs/PILOT_PROTOCOL.md).
