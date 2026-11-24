# Uitvoeropdracht — UX na de Qwen-workshoptest

## Opdracht en uitgangspunt

Verbeter de bestaande app in `C:\Software\COOCK Machining Simulator` op basis van `docs/ux-qwen/REPORT.md`. Dit document is de nieuwe UX-vervolgopdracht; `IMPROVEMENT_INSTRUCTIONS.md` beschrijft de eerdere verbeteringsronde en blijft behouden als historie.

Lees eerst de toepasselijke `AGENTS.md`, `BUILD_INSTRUCTIONS.md`, `docs/MODEL.md`, `docs/WORKSHOP.md` en het Qwen-rapport. Controleer de actuele code, tests en Git-status voordat je wijzigingen aanbrengt. Behoud werk van anderen. Werk zelfstandig tot implementatie en relevante tests afgerond zijn. Wijzig geen PLC, HMI of andere projecten en publiceer niets extern.

De deelnemer kent verspaning, maar kent deze app niet en leest vooraf geen handleiding. De app moet zelfstandig experimenteren en een onderbouwd orderbesluit ondersteunen. Voeg gerichte instructies op het beslismoment toe; voorkom extra tekstblokken en onnodige stappen.

Behoud de rekenkern, bestaande functionaliteit en offline werking. Pas het model alleen aan wanneer een onafhankelijk aangetoond defect dit noodzakelijk maakt. De Qwen-test is één AI-walkthrough, geen bewijs van menselijke foutpercentages.

## 1. P1 — Eén samenhangende orderstatus

Maak bij een productieorder een compacte besliskaart die tijd, hoeveelheid en vrijgave samen toont. Gebruik uitsluitend gegevens van de geselecteerde uitgevoerde proef, niet van nog gewijzigde invoervelden.

Toon minimaal:

- Gebruikte werktijd tegenover beschikbare werkuren en resterende roostertijd.
- Geproduceerd tegenover orderdoel.
- Vrijgegeven tegenover orderdoel.
- Onbevestigde stukken.
- Een tekstuele eindstatus met de reden waarom de order wel of niet tijdig volledig vrijgegeven is.

Gebruik bestaande backendgegevens en hun definities, waaronder `release_on_time`; leid leverbaarheid niet af uit alleen productieaantal, verborgen kwaliteit of kalenderduur. Maak tijdhaalbaarheid en kwaliteitsvrijgave afzonderlijk zichtbaar. Gebruik kleur alleen als aanvulling op tekst.

Breng na uitvoering het nieuwe resultaat met een passende focus-/scrollactie in beeld. Houd de compacte status tijdens het beoordelen gemakkelijk bereikbaar, bijvoorbeeld met een compacte sticky samenvatting. Zorg dat deze op kleine schermen geen bediening bedekt.

**Acceptatie:** bij de bestaande steekproefcase van 800 stuks staat duidelijk: circa 24,1 van 40 werkuren gebruikt, 15,9 uur rooster over, 800 geproduceerd, 161 vrijgegeven, 639 onbevestigd en nog niet volledig vrijgegeven. Voor de variant met eindcontrole verandert de status op basis van het werkelijk berekende resultaat. Test ook een order met onvoldoende vrijgegeven stukken bij het einde van de beschikbare tijd.

## 2. P1 — Werkuren en kalenderdoorloop scheiden

Gebruik werkuren als primaire vergelijking met het rooster. Zet kalenderdoorloop apart, expliciet inclusief nachten en andere tijd buiten de dienst. Herhaal gebruikte en beschikbare werktijd in het detailblok, zodat deelnemers geen aftreksom hoeven te reconstrueren.

Noem ongebruikte roostertijd geen garantie dat elk extra productieplan uitvoerbaar is. Gebruik consistente eenheden, afronding en definities in resultaatkaart, details en vergelijking.

**Acceptatie:** 4.326,3 kalenderminuten worden nergens rechtstreeks met 2.400 beschikbare werkminuten vergeleken als bewijs voor tijdtekort. De gebruiker kan zonder externe uitleg zien dat deze case ongeveer 24,1 werkuren gebruikt.

## 3. P1 — Besluit vóór didactische onthulling

Maak de normale leerroute: resultaat bekijken, eigen besluit kort vastleggen, daarna werkelijke simulatiekwaliteit onthullen en vergelijken met het besluit. Gebruik een korte keuze en eventueel een optionele toelichting; vereis geen lange tekst. Bied een herkenbare begeleidersroute om de nabespreking direct te openen wanneer nodig.

Bewaar het besluit per proef. Bewaar ook of het vóór of na onthulling is vastgelegd. Presenteer een achteraf gewijzigd antwoord niet als een oorspronkelijk onbeïnvloed besluit. Behoud compatibiliteit met bestaande opgeslagen sessies; ontbrekende nieuwe velden krijgen veilige defaults.

Label de onthulling expliciet: **Werkelijke simulatiekwaliteit — verandert inspectie en vrijgave niet**. Toon werkelijke kwaliteit en vrijgavestatus samen; een positief bericht over werkelijk goede stukken mag de openstaande vrijgave niet overschrijven.

Leg kort uit dat deze simulator alleen individueel gemeten goede stukken als vrijgegeven telt. Presenteer dit niet als een algemene industriële verplichting of als een beoordeling van echte steekproefplannen.

Bied bij openstaande vrijgave een actie **Probeer deze order met eindcontrole**. Deze neemt de instellingen van de bekeken proef over en verandert het vrijgavebeleid in de invoer. De gebruiker voert vervolgens bewust een nieuwe proef uit. Wis of wijzig het bestaande resultaat niet.

**Acceptatie:** onthullen verandert geen aantallen, kosten, inspecties of vrijgave. Het oorspronkelijke besluit blijft traceerbaar. De eindcontroleactie gebruikt de bekeken proef als basis, ook wanneer de huidige conceptinvoer daarvan afwijkt.

## 4. P2 — Bekijken, hergebruiken en doorgaan expliciet maken

Scheid **Bekijk resultaat** van **Gebruik deze instellingen**. Alleen bekijken verandert de conceptinvoer niet. Hergebruiken kopieert de volledige relevante configuratie, inclusief inspectiebeleid, offset en seed. Geef een korte zichtbare bevestiging.

Toon bij de uitvoerknop wanneer de invoer afwijkt van het getoonde resultaat. Maak duidelijk dat uitvoeren een nieuwe proef maakt.

Voeg bij de vergelijking **Verder met een productieorder** toe. Benoem welke proef als basis dient. Neem de procesinstellingen daarvan over, behoud de referentieproef en stel de passende ordermodus en opdrachtwaarden in. Voer niet stilzwijgend een simulatie uit.

Maak duidelijk dat teruggelezen notities een leesweergave zijn. Voeg een concrete bewerkactie toe die de juiste proef opent en het bewerkbare veld in beeld brengt.

**Acceptatie:** na een goede proef met voeding 0,18 en een slechte proef met 0,30 kan de gebruiker de goede instellingen expliciet hergebruiken. Bekijken alleen behoudt 0,30; hergebruiken zet 0,18 en de bijbehorende overige instellingen terug. Bestaande resultaten blijven intact.

## 5. P2 — Eenheden en eerste start verduidelijken

Vervang verkorte labels zoals “Wissel 20 · meet 5” door ondubbelzinnige beschrijvingen, bijvoorbeeld “wisselen na 20 stuks; inspectie elke 5 stuks”. Vermeld een afwijkende inspectieoffset waar relevant. Controleer alle vergelijkings- en samenvattingsweergaven op ontbrekende eenheden.

Maak de eerste uitvoeractie makkelijk vindbaar op een viewport van 1366 × 900 en op een smaller scherm. Markeer naam en verwachting als optioneel wanneer ze dat zijn. Een korte uitnodiging om een verwachting te formuleren mag; blokkeer de eerste proef niet op uitgebreide tekstinvoer.

Beperk horizontaal scrollen in de vergelijking. Houd proefidentiteit en de belangrijkste uitkomsten samen leesbaar; plaats detailinformatie zo nodig in een toegankelijke uitklapweergave.

## 6. Technische verificatie

Voeg gerichte gedragstests toe voor de gewijzigde beslisstatus, hergebruikacties, besluit/onthulling en sessiecompatibiliteit. Test gebruikersgedrag en betekenisvolle randgevallen, niet uitsluitend de gekozen componentstructuur.

Gebruik de bestaande basiscase als regressiecontrole: 800 stuks, 180 m/min, voeding 0,18 mm/omw, wisselen na 20 stuks, inspectie elke 5 stuks, seed 42 en het bestaande standaardrooster. Controleer de volledige configuratie tegen het testbewijs.

| Beleid | Vrijgegeven | Onbevestigd | Werktijd, ongeveer | Kalenderduur, ongeveer |
| --- | ---: | ---: | ---: | ---: |
| Steekproef | 161 | 639 | 1.446,34 min | 4.326,34 min |
| Eindcontrole | 800 | 0 | 2.213,14 min | 6.053,14 min |

Deze cijfers zijn regressiereferenties, geen waarden om in de UI vast te programmeren. Onderzoek afwijkingen voordat je verwachtingen aanpast.

Voer de bestaande Python- en frontendtests en productiebuild uit. Controleer daarna de app daadwerkelijk in de browser: eerste proef, mislukte variant, vergelijken, instellingen hergebruiken, weekorder, besluit, onthulling, eindcontrolevariant en bewaren/heropenen. Controleer toetsenbordbediening, focus, kleine viewport en afwezigheid van consolefouten. Vermeld beperkingen eerlijk.

## 7. Nieuwe Qwen-test en menselijke pilot

Gebruik de beschikbare Qwen Delegator volgens de toepasselijke skill. Start een nieuwe sessie zonder het eerdere rapport of gewenste antwoorden mee te geven. Gebruik vanaf de eerste beurt één screenshot plus uitsluitend zichtbare tekst en veldwaarden. Geef geen broncode, verborgen DOM-inhoud of modelwaarheid mee.

Laat Qwen maximaal twee handelingen per beurt kiezen en voer die letterlijk uit. Meld onuitvoerbare handelingen feitelijk. Geef geen inhoudelijke hulp vóór het eerste eindbesluit; markeer eventuele begeleide stappen daarna afzonderlijk.

Gebruik deze taken in volgorde:

1. Maak tien assen en beoordeel de proef.
2. Probeer goedkoper te produceren en vergelijk met de eerste proef.
3. Gebruik de eerder goede instellingen voor een order van 800 stuks in vijf werkdagen van acht uur.
4. Beoordeel of de productie binnen het werkrooster past.
5. Beoordeel afzonderlijk of 800 stukken volgens de app zijn vrijgegeven; voer zo nodig een volgende proef uit.

Bewaar prompts, antwoorden, handelingen, screenshots, appversie, viewport en hulpinterventies onder een nieuwe map in `docs/`. Houd de oorspronkelijke testbestanden intact. Rapporteer of tijd en vrijgave zonder hulp juist worden gecombineerd, of instellingen bewust worden hergebruikt en of onthulling als uitleg wordt begrepen.

De aangescherpte taakbrief verschilt van de eerste walkthrough: claim daarom geen zuivere kwantitatieve voor/na-vergelijking. Behandel beeldherkenningsfouten en fouten van de bedieningsbrug apart van appproblemen. Meet geen menselijke taakduur met modelwachttijd.

Werk het bestaande menselijke pilotprotocol compact bij voor dezelfde beslispunten. Een echte deelnemerspilot vereist deelnemers en mag niet als uitgevoerd worden gerapporteerd wanneer alleen Qwen is gebruikt.

## Oplevering

Lever werkende wijzigingen, relevante tests, bijgewerkte korte workshopinstructies en een beknopt testverslag op. Leg belangrijke keuzes en eventuele resterende beperkingen vast. Gebruik betekenisvolle Git-commits wanneer toegestaan; neem geen wijzigingen van anderen mee. Rapporteer wat geïmplementeerd is, welke controles zijn geslaagd en welke bevindingen nog door echte deelnemers moeten worden getoetst.
