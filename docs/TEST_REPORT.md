# Testverslag — model 2.0.0

Uitgevoerd op 15 november 2026, Windows, Python 3.14.6 en Node 22.22.0. Dit zijn zelfstandige softwarecontroles; geen menselijke gebruikerstest of industriële modelvalidatie. Het eerdere v1-verslag is terug te vinden in Git-commit 03d27c2.

## Automatische controles

- 37 Python-tests geslaagd: 17 bestaande kernchecks, 10 vrijgave-/meetplan-/profielchecks en 10 API-checks. Controle op aantallen, tijd, materiaal/kosten, gedeeltelijke eindoperaties, dubbele inspectie, informatiebeschikbaarheid, nul vrijgave, reproduceerbaarheid, oude modellen en strikte invoer.
- 7 frontendtests geslaagd: verliesvrije opslag, grote reeksen, Unicode, beschadiging, oude cacheformaten, ongeldige tijdelijke invoer en geldige meetverschuiving/vrijgavekeuzes.
- TypeScript en definitieve productiebuild geslaagd: index-Vp6hGarF.js. Geen nieuwe afhankelijkheden geïnstalleerd.
- 41 scenariovergelijkingen uitgevoerd met beide kwaliteitsscenario's en seeds 42, 43, 44. Volledige instellingen en uitkomsten: scenario-results-v2.json. Onafhankelijke review van vrijgave en interface leidde tot een vaste profielschaal en strengere cachevalidatie; geen bevestigde kritieke fout bleef open.

Herhalen:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe tools\validate_scenarios.py
cd frontend
npm test
npm run build
```

## Verwachtingen en waarnemingen

| Proef | Verwachting | Werkelijk resultaat | Beoordeling |
| --- | --- | --- | --- |
| Basiscase, week800, eindcontrole, wissel8 | Kwaliteit behouden, veel wisselkosten | 800 vrijgegeven; 2393,14 min; EUR8,74 per vrijgegeven stuk | Past nipt; geen universeel optimum |
| Zelfde, wissel40 | Lagere kosten met voldoende kwaliteit | 800 vrijgegeven; 2153,14 min; EUR7,56/stuk | Economisch verdedigbaar in deze case |
| Zelfde, wissel80 | Verborgen afkeur en tijdgebrek bij vrijgave | 920 bruto; 547 vrijgegeven; 37 onbekend; 2400 min; EUR12,39/vrijgegeven | Order niet vrijgegeven; gedeeltelijk eindwerk correct meegenomen |
| Wissel50, reactie na gemeten afkeur | Eindcontrole vindt tekorten; aanvulling kan levering redden | 817 bruto; 800 vrijgegeven; 17 afkeur; 2191,68 min; EUR7,69/stuk | 4 stukken na begin eindcontrole aangevuld; eerdere vervanging valt in nominale productiefase |
| Proef800, wissel80, inspectie40, meetfase0 versus10 | Gelijk meetbudget kan andere indruk geven | Beide 21 inspecties, 491 werkelijk goed en 1188,34 min; gemeten afkeur10 versus8 | Gemonsterde leeftijden {1,40,80} versus {1,10,50}; fysica blijft gelijk |
| Strengere eis bij dezelfde procesinstellingen | Een eerdere keuze hoeft niet meer te voldoen | Wissel8/eindcontrole slechts647–655 vrijgegeven over seeds42–44 | Procesinstellingen heronderzoeken; niet alleen interval kiezen |
| Nul goede stukken / onmogelijke order | Geen eindige kost/vrijgegeven of volledige levering | Null bij nul vrijgave; eindrooster begrenst productie | Gedekt door tests en scenario-evidence |

## Definitieve browsercontrole in Microsoft Edge

De standaardproef uitgevoerd, verwachting ingevuld, voeding gewijzigd naar0,24 en vergelijking geopend: EUR7,03 tegenover EUR6,83 per werkelijk goed stuk. Serverprofiel geeft voedingsafstand en veranderde profielhoogte op vaste schaal0–25µm. Instellingen die nog niet zijn uitgevoerd krijgen een waarschuwing naast de oude visualisatie.

Vervolgens week800 met eindcontrole/bijsturing en de drie wisselstrategieën8/40/80 uitgevoerd; vrijgavewaarden hierboven komen overeen met de browser. Gemeten en werkelijke kwaliteit blijven onderscheiden. Productiegebeurtenissen voor snijden, inspectie, wissels en wachten zijn beschikbaar; eindcontroles worden via het inspectietype aangeduid. Pauze en12× gekozen. De export herberekent uitsluitend dezelfde opgeslagen instellingen; afspelen verandert deze niet.

Zes volledige proeven als JSON gedownload (7,93MB) en onafhankelijk alle zes exact tegen de API/rekenkern herberekend. CSV en samenvatting via de knoppen gedownload; CSV bevat920 stukken, waarvan547 gemeten goed. Ook op de definitieve build opnieuw CSV geëxporteerd na afspelen.

Het app-tabblad gesloten (waardoor ook het laatste Edge-venster sloot), Edge opnieuw gestart en de app geopend: alle zes proeven en laatst geselecteerde resultaat bleven aanwezig. Tijdelijk snelheid0 ingevuld en herladen: alle proeven behouden, geldige waarde180 hersteld. Dit gebeurde op de definitieve build na de laatste bronwijziging.

Desktop en smalle weergave gecontroleerd. Bij600px viewport mat het document585px breed en scrollWidth585px: geen horizontale pagina-overloop. Opdrachten en navigatie visueel leesbaar. Geen JavaScript-fouten of waarschuwingen in de gecontroleerde browserconsole.

## Gevonden problemen en herstel

- Oppervlakteprofiel normaliseerde zijn eigen hoogte, waardoor voedingsverandering nauwelijks zichtbaar werd: vaste verticale schaal0–25µm ingevoerd en verklarende tekst gecorrigeerd.
- Inspectiegebeurtenis gaf geen eindcontrolelabel: UI leidt dit af uit het serverinspectietype.
- Vergelijking toonde alleen grondwaarheid: vrijgegeven output, vrijgavekost, vrijgavelevering, beleid en meetfase toegevoegd.
- Oude browseropslag: beschermd tegen overschrijven, met daadwerkelijk geteste backupdownload. Model1-bestanden worden expliciet geweigerd; API-test bevestigt409 in plaats van schijnreproductie.
- Het sluiten van het laatste Edge-tabblad verbrak de automatiseringsverbinding: browser normaal opnieuw gestart, herverbonden en bewaartest voltooid.

## Verificatiegrenzen

Bestand opnieuw selecteren via de Edge-uitbreiding werd geblokkeerd omdat de uitbreiding geen toegang tot file-URLs heeft. Deze toestemming is niet gewijzigd. Voor die automatisering is in Edge bij de ChatGPT-uitbreiding de optie 'Allow access to file URLs' nodig; zie https://developers.openai.com/codex/app/chrome-extension#upload-files. De JSON-import via de bestandskiezer kon daardoor niet volledig in Edge worden afgemaakt. Browseropslag na sluiten/herstart is wel gecontroleerd; de daadwerkelijke gedownloade JSON is onafhankelijk exact herberekend en versie-/scenarioafwijzing wordt automatisch getest. Geen volledige browseracceptatie van bestandsimport geclaimd.

De testclient meldt nog een niet-blokkerende Starlette/httpx-deprecatiewaarschuwing. Dit raakt de lokale productie-app niet. Menselijke bruikbaarheid en industriële modelcoëfficiënten blijven onbeproefd; PILOT_PROTOCOL.md beschrijft de toekomstige proef met twee of drie deelnemers. Geen verbinding met echte machines of externe publicatie uitgevoerd.
