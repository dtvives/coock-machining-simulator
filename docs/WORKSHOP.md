# Workshop — van proefstuk naar vrijgegeven order

Voor technisch geïnteresseerde medewerkers van bedrijven met verspanende machines. Werk per duo: één bedient, één noteert verwachting en bewijs; wissel na iedere proef. De C45-case, slijtage en kosten zijn illustratief. De app geeft geen snijadvies voor een echte machine en communiceert niet met PLC of HMI.

## Voorbereiding

In de UX-versie bekijk je een resultaat zonder daarmee de invoer te wijzigen. Kies **Gebruik deze instellingen** om een eerdere proef als basis te nemen. Beoordeel bij een weekorder werkuren tegenover roosteruren én vrijgegeven aantal tegenover orderdoel. Leg eerst je besluit vast en onthul daarna de werkelijke simulatiekwaliteit. Die onthulling verandert de vrijgave niet. De simulator telt alleen individueel gemeten goede stukken als vrijgegeven; dit is een modelregel, geen algemene norm voor industriële meetplannen.

Eindcontrole klaarzetten berekent nog niets: start daarna bewust een nieuwe proef. Vergelijken kan direct naast het besluit. Exports bevatten werkelijke simulatiekwaliteit; bewaar het oorspronkelijke besluit vóór export. De app markeert latere besluiten als na onthulling/export.

De conceptweergave toont de instellingen voor de volgende volledige simulatie; **Simuleer deze proef** maakt een nieuw resultaat. Terugkijken naar de vorige uitkomst behoudt je concept. Kies bij hergebruik expliciet de bron voor de volgende proef; de vergelijkingsreferentie dient alleen voor vergelijking. Lees gemeten goed/totaal, gemeten afkeur en ongemeten samen: drie gemeten goede en zeven ongemeten stukken betekenen geen zeventig procent afkeur.

**Beoordeel deze proef** brengt je vanuit de resultaatkop naar het besluit. **Instellingen overnemen voor nieuwe proef** opent uitsluitend een nieuw concept; het legt geen inhoudelijk besluit vast.

Start volgens de README en controleer op elke workshop-pc uitvoeren, bewaren en opnieuw openen. Gebruik voor vergelijkingen hetzelfde scenario, dezelfde hoeveelheid en seed; herhaal conclusies met seeds 42, 43 en 44. Een reeks bevat maximaal twaalf proeven: archiveer en reset tussen oefenblokken. Lees de definities in [MODEL.md](MODEL.md). Het protocol voor een voorafgaande proef met echte deelnemers staat in [PILOT_PROTOCOL.md](PILOT_PROTOCOL.md); die proef is nog niet uitgevoerd.

## Voormiddag 09:30–12:00 — maak een goed stuk tegen een goede kost

**Opdracht:** maak tien afstandsassen binnen de kwaliteitseisen en onderbouw een betaalbare procesinstelling.

Start met scenario **C45 afstandsas**: Ø30 → Ø24 mm over 80 mm, drie vaste gangen; Ra ≤3,2 µm en Ø24 ±0,025 mm. Kies proefreeks, 10 stukken, 180 m/min, 0,18 mm/omw, wissel na 20, inspectie iedere 5 stukken, meetfase 0, steekproefbeleid, reactie na afkeur uit en seed 42. Het eerste stuk wordt altijd geïnspecteerd.

1. **09:30–09:50:** lees de opdracht, voorspel de uitkomst en voer de uitgangssituatie uit. Bewaar deze als referentie. Benoem wat gemeten is en wat onbekend blijft.
2. **09:50–10:30:** verhoog uitsluitend voeding naar 0,24 mm/omw. Voorspel het effect op snijtijd en profiel. Vergelijk daarna kwaliteit, tijd en kost per werkelijk goed stuk.
3. **10:30–10:45:** pauze; download de oefening als JSON.
4. **10:45–11:20:** kies een volgende proef op basis van een concrete waarneming. Onderzoek bijvoorbeeld snijsnelheid. Bekijk de productiestappen en het ideale oppervlakteprofiel. Een hoger profiel verklaart geometrie, niet alle echte kwaliteitsvariatie.
5. **11:20–11:40:** herhaal de vergelijking met seeds 43 en 44. Kies vervolgens fijne afwerking (Ra ≤1,6 µm; Ø24 ±0,015 mm). Scenarioselectie laadt startinstellingen: voer bewust dezelfde eerdere procesinstellingen opnieuw in als je uitsluitend de strengere eis wilt vergelijken.
6. **11:40–12:00:** toon de werkelijke simulatiekwaliteit, beantwoord de vier reflectievragen en exporteer het bewijs.

**Begeleider:** één variabele tegelijk. De profieltekening toont ideale voedingsgeometrie; Ra en diameter bevatten daarnaast illustratieve slijtage en spreiding. De animatie speelt servergebeurtenissen af en is geen extra validatie van het model.

## 12:00–13:00 — netwerklunch

Gesprekstarter: welke productiebeslissing blijft in jullie bedrijf onzeker door ontbrekende informatie over kwaliteit, gereedschap of stilstand?

## Namiddag 13:00–15:30 — lever een vrijgegeven order

**Opdracht:** lever 800 assen binnen vijf diensten van acht uur. Vergelijk zowel werkelijke kwaliteit als aantoonbare vrijgave en kost. Elke simulatie begint opnieuw; slijtage loopt binnen een simulatie over stukken en diensten door.

Start met productieweek, scenario C45 afstandsas, 800 stukken en de overige ochtendinstellingen. Bewaar een aparte weekreferentie.

1. **13:00–13:25 — wat betekent klaar?** Voer het steekproefbeleid uit. Nominaal geaccepteerd is geproduceerd minus gemeten afkeur. Niet-geïnspecteerde stukken zijn onbevestigd; alleen gemeten goede stukken zijn vrijgegeven. Bekijk daarna hetzelfde proces met eindcontrole vóór vrijgave. Eindcontrole kost tijd; reeds geldig gecontroleerde stukken worden niet opnieuw gecontroleerd. Bij gevonden afkeur kan aanvullende productie volgen zolang het rooster ruimte biedt.
2. **13:25–14:00 — drie gereedschapsstrategieën.** Vergelijk wisselen na **8, 40 en 80 stukken**, verder identiek. Begin met steekproeven; onderzoek vervolgens eindcontrole. Vroeg wisselen kan duur zijn; 40 is in de basiscase een verdedigbare vergelijking, geen universeel optimum; 80 maakt het risico van slijtage zichtbaar. Herhaal minstens één vergelijking met een andere seed en met de strengere kwaliteitseis. Vergelijk die strengere case eerst bij dezelfde procesinstellingen.
3. **14:00–14:10 — pauze.** Archiveer de reeks en start zo nodig een nieuwe.
4. **14:10–14:35 — wanneer meet je?** Gebruik voor een gecontroleerde proef **proefreeks 800**, wissel na **80**, inspectie iedere **40**, reactie uit, meetfase **0** tegenover **10**. Het eerste stuk is steeds verplicht. Beide plannen hebben 21 controles; de gemeten gereedschapsleeftijden verschillen. Bekijk de verdeling van die leeftijden, gemeten afkeur en werkelijke afkeur. Houd fysische instellingen en seed gelijk. Een gunstigere steekproef is geen beter proces.
5. **14:35–14:55 — informatie en actie.** Ga terug naar weekorder 800. Kies een laat wisselinterval, inspectie iedere 5 en vergelijk reactie na gemeten afkeur uit/aan. Een gevonden fout houdt het gemeten slechte stuk tegen; de expliciete regel wisselt vóór de volgende snede. Er is geen automatische terugwerkende batchquarantaine. Vergelijk daarnaast eindcontrole met aanvullende productie. Noteer wat door tijdgebrek onbevestigd blijft.
6. **14:55–15:10 — grenzen.** Probeer een order 5000 en een voorzichtige instelling van 80 m/min en 0,08 mm/omw. Bekijk de oorzaak van niet-leveren, resterende inspecties en onafgewerkt werk. Zoek twee strategieën met gelijke vrijgegeven output maar verschillende kosten; een lagere prijs per werkelijk goed stuk alleen bewijst geen leverbaarheid.
7. **15:10–15:30 — bedrijfsproef.** Beantwoord de reflectievragen, exporteer resultaten en ontwerp één gecontroleerde proef voor de eigen machine. Geen automatische jaaromrekening of dubbele waardering van capaciteit en arbeid.

**Begeleider:** eindcontrole veronderstelt perfecte meting van het gesimuleerde stuk, zonder meetfouten. In een bedrijf zijn meetonzekerheid en vrijgavecriteria apart nodig. Alle bewerkingen kunnen volgens de lesafspraak over dienstgrenzen pauzeren; dat is geen advies om een echte snede stil te zetten. Aan het weekeinde blijven tijd, materiaal en slijtage van gedeeltelijk werk kosten. Een onafgeronde inspectie geeft geen vrijgave. Lees MODEL.md voor de exacte eindregels en categorieën.

## Afronding van elke oefening

1. Wat heb je geleerd?
2. Welke waarneming ondersteunt dat? Vermeld proef, instellingen, seed en meetbaar verschil.
3. Welke informatie ontbreekt voor jouw machine, materiaal, gereedschap en meetketen?
4. Welke gecontroleerde proef zou je in je bedrijf uitvoeren? Benoem één wijziging, vaste omstandigheden, kwaliteitsgrens en stopcriterium; laat de procesverantwoordelijke die proef voorbereiden volgens de bedrijfsprocedure.

Softwarecontroles en synthetische uitkomsten vervangen geen deelnemersproef of industriële modelvalidatie. Controlewaarden staan hieronder en in het reproduceerbare bewijsmateriaal.

## Gecontroleerde voorbeelden voor de begeleider

Deze waarden zijn werkelijk met model **2.0.0** uitgevoerd; het zijn synthetische controles, geen machinevalidatie. Volledige instellingen, seeds en samenvattingen staan in [scenario-results-v2.json](scenario-results-v2.json). Herhaal met `.\.venv\Scripts\python.exe tools\validate_scenarios.py` vanuit de projectmap.

Basisscenario, seed 42, order 800, 180 m/min en 0,18 mm/omw, inspectie iedere 5, reactie uit:

| Wisselinterval | Beleid | Werkelijk goed | Vrijgegeven | Dienstminuten | EUR/werkelijk goed |
| --- | --- | ---: | ---: | ---: | ---: |
| 8 | steekproef | 800 | 161 | 1626,34 | 7,54 |
| 40 | steekproef | 800 | 161 | 1386,34 | 6,37 |
| 80 | steekproef | 539 | 102 | 1479,81 | 10,07 |
| 8 | eindcontrole | 800 | 800 | 2393,14 | 8,74 |
| 40 | eindcontrole | 800 | 800 | 2153,14 | 7,56 |
| 80 | eindcontrole | 579 | 547 | 2400,00 | 11,71 |

Bij dezelfde basisinstellingen en seeds 42–44 blijft de voorkeur voor 40 tegenover 8 in deze voorbeeldcase bestaan; beide geven met eindcontrole 800 vrijgegeven stukken. Wisselen na 80 haalt met eindcontrole slechts 545–548 vrijgegeven stukken. Met de strengere kwaliteitseis en dezelfde procesinstellingen faalt zelfs interval 8: 647–655 vrijgegeven stukken bij eindcontrole. De lagere startvoeding en snelheid van het fijne scenario zijn dus geen cosmetische wijziging; laat deelnemers die bewust onderzoeken.

Aanvullen kan wel slagen: basisscenario, wissel 50, eindcontrole en reactie na afkeur **aan**, overige basisinstellingen, produceert 817 stukken waarvan 800 goed en vrijgegeven in 2191,68 dienstminuten (€7,69 per goed/vrijgegeven stuk).

Voor de meetfaseproef (800 bruto, wissel 80, inspectie 40, reactie uit, seed 42) hebben fase 0 en 10 beide **21 controles** en dezelfde **491 werkelijk goede stukken**. Fase 0 ziet 10 afkeur, fase 10 ziet er 8. Fase 0 meet gereedschapsleeftijden 1, 40 en 80; fase 10 meet 1, 10 en 50. Beide besteden 1188,34 dienstminuten. Dat is een verschil in waarneming, niet in proceskwaliteit. Eindcontrole zou het controlebudget veranderen en hoort daarom niet in deze geïsoleerde vergelijking.
