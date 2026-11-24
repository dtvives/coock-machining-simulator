# Vervolgplan na de vierde UX-ronde

Status: navigatie geïmplementeerd en drie koude Qwen-tests uitgevoerd op build `nKOybW84`. Alle drie zelfstandig geslaagd; echte browserimport blijft onbevestigd door een defecte uploadverbinding. Details: `docs/ux-qwen-v5/REPORT.md` en `VERIFICATION.md`. Oorspronkelijke basis: `a1bc437`, build `Dydj8BOg`. Doel: de resterende navigatiefrictie verminderen en een onafhankelijke weekdoorloop betrouwbaar toetsen.

## Analyse en besluit

De scheiding concept/resultaat, het meetbewijs en de gerichte vergelijking werken aantoonbaar beter. Qwen wijzigde één factor, begreep 3/3 gemeten goed versus 7 ongemeten en herkende dat goedkoper produceren met nul vrijgave geen verbetering is. De geholpen weekfase doorliep voorbereiden en uitvoeren correct. Behoud deze structuur.

De volledige zelfstandige weekflow is nog onbewezen. De bronkeuze werd gevonden en Qwen wilde inhoudelijk de juiste proef, maar de testbrug leverde de geopende native opties niet leesbaar aan. Dit is primair een observatieprobleem in de test. Het bewijst niet dat een menselijke deelnemer een andere widget nodig heeft. Controleer deze verklaring eerst met echte popupbeelden en gecontroleerde bediening.

De afsluitfase kostte tien acties en een onnodige extra proef. De laag geplaatste besluitsectie en verschillende betekenissen van kiezen/hergebruiken zijn plausibele appoorzaken. De fase begon echter direct na een vastgelopen weektaak met dezelfde geschiedenis: de verwarring kan deels daarvan afkomstig zijn. Een onafhankelijke taak moet dat onderscheiden.

De viewport veranderde na browserherstel naar 1280×720. Twee scrollstappen naar de startknop zijn een concreet signaal, maar geen zuivere regressiemeting ten opzichte van 1366×900. Daarnaast ontbreken bevestigde import en een echte API-foutcontrole op de definitieve build. Automatische tests sluiten deze hiaten niet.

## Stap 1 — Testbrug kwalificeren vóór verdere Qwen-aanvragen

- Gebruik één eigenaar/runtime voor alle browserbediening. Een afzonderlijke agent mag Qwen-aanvragen verwerken, maar neemt geen browserhandles over.
- Controleer eerst de beschikbare browser-/native mogelijkheden voor popupwaarneming, bestandskiezer en screenshots. Gebruik de ondersteunde route; installeer geen workaround voordat is vastgesteld wat ontbreekt.
- Leg vóór elke ronde browser, buildhash, viewport en screenshotafmetingen vast. Na reconnect opnieuw controleren. Bij afwijking pauzeren of een nieuwe ronde starten; niet achteraf dezelfde conditie claimen.
- Voer een korte technische proef uit: bronkeuze openen, daadwerkelijk geopende opties vastleggen, één optie kiezen en de overgenomen instellingen controleren. Native popup kan een afzonderlijk screenshotgebied vereisen.
- Als tekst nodig is: uitsluitend de werkelijk geopende lijst letterlijk transcriberen, als afzonderlijk bewijs naast het beeld. Geen verborgen DOM-opties vooraf naar Qwen sturen en geen gewenste optie aanwijzen.
- Test ook focus, scroll en één complete import. Eén mislukte bestandskiezeractie krijgt een begrensde herstelpoging; herstel eerst de verbinding voordat andere controles doorgaan.

Acceptatie: een onafhankelijke lezer kan op het vastgelegde geopende scherm alle aangeboden bronkeuzes onderscheiden. Zolang dat niet lukt, geen volledige koude ronde starten die deze bediening vereist. Native select behouden tenzij ook deelnemers of toegankelijkheidscontrole een productprobleem aantonen.

## Stap 2 — Kortere route naar starten en beoordelen

- Maak de grote introductie compacter zodat opdracht, conceptstatus en startactie bij 1280×720 bereikbaar zijn zonder twee schermen te scrollen. Behoud product, kwaliteitseisen en rooster; plaats uitgebreide toelichting bij verdieping.
- Plaats bij de resultaatkop naast de kernuitkomst een duidelijke actie **Beoordeel deze proef** die naar de besluitsectie scrollt én focus geeft. Een directe compacte besluitsectie bij de kernuitkomst is ook mogelijk als dat zonder overvol scherm past. Kies één consistente oplossing.
- Gebruik **Instellingen overnemen voor nieuwe proef** voor hergebruik. Laat expliciet zien dat deze actie een concept opent. Gebruik de term besluit alleen bij de inhoudelijke beoordeling.
- Houd vergelijking, nieuwe proef en beoordeling herkenbaar als verschillende acties. Onthulling blijft gekoppeld aan het voorafgaande besluit; vergelijken blijft direct mogelijk.
- Vereenvoudig de dubbele titel `Proef 5 · Proef 5`: toon het nummer altijd eenmaal en alleen daarnaast een afwijkende gebruikersnaam. Unieke interne IDs blijven leidend.
- Controleer bij de wijzigingssamenvatting de overgang proefreeks→weekorder: modus en aantal veranderen samen door de oefening. Presenteer dat als verandering van opdracht; de waarschuwing over meerdere factoren hoort vooral bij meerdere proces-/beleidswijzigingen binnen een vergelijkbare opdracht.

Acceptatie: de gebruiker ziet op een compact desktopscherm de startactie met opdrachtcontext; vanaf ieder resultaat is beoordeling via één herkenbare actie bereikbaar. Die actie verandert geen instellingen, maakt geen nieuwe proef en onthult niets automatisch. Toetsenbordfocus volgt de gekozen route. Terugkijken behoudt conceptinvoer.

## Stap 3 — Technische verificatiehiaten sluiten

- Test echte bestandsimport en exact herberekenen met een oude v2-sessie én een actuele sessie; geen oude onthulling of conceptstatus laten doorsijpelen.
- Test een werkelijk mislukte simulatie-aanvraag in een geïsoleerde lokale testopstelling met ondersteunde foutinjectie of een eigen testserver. Concept en bestaande proeven moeten blijven bestaan, foutmelding moet herstel mogelijk maken en opnieuw uitvoeren moet slagen. Stop geen gedeelde server om dit te forceren.
- Herhaal de gewijzigde routes op de definitieve build bij 1280×720 en 600×900: bronselectie, concept/resultaat, besluitfocus, onthulling en sessieherstel.
- Behoud bestaande referentieberekeningen; run passende frontend-/Pythontests en productiebuild. Voeg gedragstests toe voor gewijzigde interacties, geen tests die alleen teksten vergelijken.

## Stap 4 — Gerichte koude diagnose, daarna volledige ronde

Bevries de build na technische verificatie. Geen aanpassingen tijdens een ronde. Eén zichtbare UI-actie per beurt; screenshot plus vaste, strikt zichtbare transcriptie; exact eigen actielog; geen README of eerdere bevindingen. Geef taken per fase zonder knopnamen. Behoud de bestaande stopregels: maximaal twaalf acties per deelopdracht en drie herhalingen zonder voortgang. Een technische beperking krijgt een afzonderlijke classificatie.

1. **Onafhankelijke weektaak:** nieuwe Qwen-rol, een expliciet voorbereid testbestand met twee eerdere proeven. Opdracht: kies een verdedigbare instelling voor 800 vrijgegeven stukken in vijf diensten van acht uur en onderbouw de uitkomst. Dit is een koude deeltest, geen volledige workshop. Geen instructie welke proef of welk meetbeleid te kiezen.
2. **Onafhankelijke afsluiting:** andere nieuwe rol bij een uitgevoerd resultaat, zonder eerdere vastgelopen taak. Opdracht: leg vast of de beschikbare metingen voldoende bewijs leveren voor de getoonde opdracht en bekijk daarna de volledige simulatiekwaliteit. Zo wordt beoordeeld of de afsluitfrictie ook zonder vastloopgeschiedenis bestaat.
3. **Volledige koude workshop:** nieuwe lege oefening en nieuwe rol op dezelfde definitieve build; eerste proef, één factor wijzigen en vergelijken, weekorder, besluit en nabespreking. Geen vooringestelde successcenario's. Alle fasen uitvoeren of volgens vooraf vastgelegde regels stoppen.

Rapporteer per taak zelfstandigheid, verkeerde verwachtingen, herstel, hulp en technische problemen. Een correct onderbouwd negatief leverbesluit kan slagen; een onterecht positief besluit niet. Qwen hoeft geen optimale productie-instelling te vinden. Gerichte of geholpen tests vervangen geen volledige koude uitkomst.

## Afronding en beslismoment

De iteratie is klaar wanneer de kleine navigatieverbeteringen technisch gecontroleerd zijn, de observatie van bronopties werkt, import/foutherstel werkelijk zijn getest en de nieuwe koude ronde eerlijk is vastgelegd. Een vastgelopen Qwen-taak blijft een bevinding, geen reden om eindeloos de interface op één model af te stemmen.

Plan daarna twee of drie echte deelnemers zonder voorafgaande handleiding. Toets vooral starten, bronkeuze, besluit versus hergebruik, en gemeten afkeur versus ongemeten kwaliteit. Als mensen deze routes wel begrijpen, verbeter de testbrug of taakbrief in plaats van extra productstappen toe te voegen. Bij gedeelde frictie volgt een gerichte UX-wijziging.

Bewaar volgende bewijzen in `docs/ux-qwen-v5/`. Maak afzonderlijke lokale commits voor navigatie, technische verificatie en testverslag. Eerdere plannen en testbewijzen blijven intact.
