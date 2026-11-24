# Volgende UX-iteratie: concept, resultaat en herstel

Status: geïmplementeerd en getest op 15 november 2026; volledige koude ronde uitgevoerd, met technische blokkade bij weekbronselectie en veel zoekwerk bij afsluiten. Zie `docs/ux-qwen-v4/REPORT.md` en `VERIFICATION.md` voor precieze dekking en resterende beperkingen. Oorspronkelijke basis: commit `685724a`. Doel: een deelnemer doorloopt beide oefeningen en herstelt na een mislukte proef zonder externe uitleg.

## Analyse

De grootste resterende frictie is de vermenging van gewijzigde invoer en eerder berekende resultaten. `prepared` is nu een tekstmelding boven het resultaat, terwijl de oude `.order-status` sticky is. Daardoor kan de oude status zichtbaar blijven en de nieuwe uitvoeractie uit beeld verdwijnen. Beurt 16 bevestigt dit risico: de transcriptie bevat de oude orderstatus en klaarzettekst, maar niet de lokale uitvoerknop. Qwen noemt de eindcontrole vervolgens uitgevoerd. De precieze visuele oorzaak moet bij implementatie nog in de browser worden bevestigd.

De vergelijking bevat drie verschillende keuzes: vergelijkingsbasis, vergelijkingspartner en instellingen voor de volgende proef. De laatste selector is pas na de koude ronde toegevoegd. Eerst toetsen of die werkt; niet zonder bewijs nog een extra keuzemechanisme toevoegen.

Resultaten blijven inhoudelijk dubbelzinnig: 3/10 vrijgegeven wordt gelezen als 30% kwaliteit, terwijl 3/3 gemeten goed en 7 ongemeten bedoeld is. Inspectie krijgt ten onrechte de rol van procesverbetering. De nieuwe afkeurmelding helpt mogelijk, maar is nog niet koud getest en is te absoluut bij geringe afkeur: extra controle en aanvulling kunnen dan wel degelijk een verdedigbare strategie zijn.

De laatste test levert geen zuivere vergelijking met eerdere rondes. Alle opdrachten werden tegelijk gegeven, de beginpositie stond niet bovenaan, transcriptie veranderde na beurt 1 en korte handelingensamenvattingen vervingen een volwaardige gespreksgeschiedenis. Ook vroeg de prompt herhaaldelijk of een proef opnieuw begint: correcte antwoorden daarop zijn dus geen bewijs van spontaan begrip. Twee acties per beurt veroorzaakten onuitvoerbare combinaties na navigatie. Deze factoren kunnen fouten versterken.

## 1. Maak concept en uitgevoerd resultaat afzonderlijk herkenbaar — P1

- Gebruik expliciete UI-toestanden: instellingen bewerken, berekening bezig, uitgevoerd resultaat bekijken. Bewaar berekende proeven onveranderd.
- Hergebruik, nieuwe order of eindcontrole opent de conceptweergave en brengt de startkaart in beeld met focus. Toon bronproef, hoeveelheid, procesinstellingen, inspectiebeleid en rooster.
- Eén primaire actie: **Simuleer deze proef**. Vermeld compact: volledige nieuwe simulatie vanaf het begin.
- Toon tijdens bewerken geen oude orderstatus als actuele hoofdstatus. Houd de vorige proef bereikbaar via **Bekijk vorige uitkomst: [naam]**; conceptinvoer blijft behouden bij heen en weer navigeren.
- Na uitvoeren: focus op het nieuwe resultaat met uniek proefnummer, naam en daadwerkelijk gebruikte instellingen. Tijdens berekening geen oud resultaat presenteren als nieuwe uitkomst; bij fout concept behouden en herstelbare melding tonen.
- Handmatige wijzigingen na een resultaat krijgen dezelfde expliciete conceptstatus. Vergelijk inhoudelijk met de laatst uitgevoerde configuratie; geen status afleiden uit alleen een klaarzettekst.

Acceptatie: na klaarzetten én na handmatig wijzigen kan de gebruiker benoemen wat al uitgevoerd is en wat nog moet starten. Bronresultaat blijft behouden. Herladen/import/reset levert geen conceptmelding bij het verkeerde resultaat op. Test ook een ongeldige invoer en een mislukte API-aanvraag.

## 2. Maak terugkeren naar een eerdere strategie eenvoudig — P1

- Behoud voorlopig de nieuwe selector **Instellingen voor volgende proef**; toon bij de keuze ook snelheid, voeding, hoeveelheid en inspectiebeleid.
- Zet selectie en vervolgactie boven de lange vergelijking zodat ze zonder zoeken bereikbaar zijn.
- Benoem de tabelradio als **Vergelijkingsreferentie** in plaats van het dubbelzinnige uitgangspunt/basis. Dit verandert geen conceptinstellingen.
- Laat de knop de gekozen bron noemen. Gebruik intern unieke IDs; dubbele gebruikersnamen mogen de selectie niet ambigu maken.
- Bied vanuit een mislukt resultaat **Kies instellingen uit een eerdere proef** met dezelfde selectiecomponent. Kies niet automatisch een zogenaamd beste proef: hoeveelheid, seed en doel kunnen verschillen.

Acceptatie: vergelijkingsreferentie A, bekeken proef B en gekozen bron C mogen verschillen; alleen C wordt volledig gekopieerd naar de nieuwe proef. Voor een weekorder worden hoeveelheid/modus bewust aangepast, overige relevante instellingen blijven behouden. De bronkeuze is vanaf een mislukt resultaat te bereiken zonder opnieuw een referentieproef te moeten uitvoeren.

## 3. Laat meetbewijs en ordervrijgave verschillende vragen beantwoorden — P1

- Toon samen **gemeten goed / gemeten totaal**, **gemeten afkeur** en **ongemeten**. Daarnaast apart **vrijgegeven / orderdoel**.
- Neem deze informatie ook op in de compacte vergelijking; gebruik vrijgave/bruto niet als enige kwaliteitsindicatie.
- Bij gemeten afkeur: geef aan dat extra inspectie afkeur kan vinden maar de kwaliteit van een bestaand stuk niet verbetert. Bied proces aanpassen én inspectiebeleid onderzoeken als bewuste keuzes; geen algemeen bevel om altijd eerst procesinstellingen te wijzigen.
- Bij uitsluitend ontbrekende metingen is eindcontrole een logische vervolgmogelijkheid. Behoud de boodschap dat de nieuwe variant opnieuw over het volledige rooster rekent.
- Behoud uitleg dat bij alle geproduceerde stukken gemeten de onthulling geen extra afkeur oplevert, binnen de huidige modelaannames.

Acceptatie: 3 gemeten goed + 7 ongemeten wordt niet gepresenteerd als 70% afkeur. De cases 201/201 gemeten afkeur en 161 goed + 639 ongemeten zijn zichtbaar verschillende problemen. Controleer ook gemengde afkeur, nul productie en uitgeput rooster.

## 4. Verminder onnodige stappen en keuzes — P2

- Vergelijken blijft beschikbaar zonder voorafgaand besluit. Alleen het onthullen van de simulatiekwaliteit vraagt eerst een besluit.
- Maak de bevestiging na opslaan feitelijk: besluit opgeslagen. Vermijd een verplichte vervolgroute naar vergelijken wanneer de deelnemer juist wil nabespreken.
- Toon een compacte wijzigingssamenvatting tegenover de gekozen bron. Bij meerdere gewijzigde factoren een niet-blokkerende aanwijzing dat oorzaken moeilijker te isoleren zijn.
- Houd docentacties en export uit de primaire deelnemersroute. Verberg geen noodzakelijke meetinformatie achter een besluitstap.

## 5. Technische verificatie vóór Qwen

Gerichte gedragstests voor concept/resultaat-overgangen, volledige kopie vanuit gekozen bron, foutafhandeling en behoud van bestaande sessies. Geen tests die uitsluitend tekststrings dupliceren. Voer de bestaande Python- en frontendtests, TypeScript en productiebuild uit.

Browsercontrole: beide oefeningen, mislukte proef herstellen, eindcontrole klaarzetten/uitvoeren, besluit/onthulling, herladen en import. Controleer op 1366×900 en een smal scherm dat de hoofdactie en proefidentiteit zichtbaar blijven en toetsenbordfocus logisch is. Rekenmodel en bestaande referentieresultaten blijven gelijk; leg onverwachte afwijkingen uit vóór de gebruikstest.

## 6. Nieuwe koude Qwen-test met vast protocol

1. Bevries build, model, prompt, viewport en transcriptiemethode vóór de eerste aanvraag. Begin met een lege geïsoleerde oefening bovenaan de pagina. Bewaar versie/hash en beginscreenshot.
2. Bied alleen de huidige workshopopdracht aan: eerst tien stukken en een gerichte vergelijking; pas na afronden de order van 800 vrijgegeven stukken in vijf diensten van acht uur. Geen knopnamen of voorgeschreven beleidskeuze in het taakbriefje.
3. Eén UI-actie per beurt. Eén actueel screenshot en strikt zichtbare tekst/waarden; geen verborgen selectopties. Gebruik een gecontroleerde, vaste extractie vanaf beurt 1. Behoud een compact letterlijk actielog en Qwens eigen conclusies; voeg geen gewenste interpretatie toe.
4. Vraag waarneming, verwachte uitkomst van de actie en onzekerheid. Vraag niet elke beurt expliciet naar het herstartprincipe. Toets dat begrip één keer neutraal bij de overgang naar een nieuwe weekvariant.
5. Voer gekozen acties letterlijk uit; meld onuitvoerbaarheid zonder routehint. Een timeout krijgt maximaal twee identieke herhalingen en telt niet als UX-fout.
6. Leg vooraf stopregels vast: maximaal 12 acties per deelopdracht; bij drie herhalingen van dezelfde route zonder voortgang wordt die deelopdracht als vastgelopen geregistreerd. Alleen een apart gelabelde geholpen fase mag daarna volgen. Geen onzichtbare correcties om een succesvolle doorloop te produceren.
7. Geen wijzigingen tijdens de koude ronde. Eventueel herstel daarna krijgt een nieuwe build en een eigen teststatus. Een gerichte vervolgtest mag een volledige koude doorloop niet vervangen.

Beoordeling per taak: zelfstandig gelukt, gelukt met zoeken, hulp nodig, vastgelopen of technisch geblokkeerd. Bewaar acties, verkeerde verwachtingen, herstel en screenshots. Geen menselijke tijdmetingen of succespercentages uit één AI-rol afleiden.

## Acceptatie voor deze iteratie

- Eerste proef en gerichte vergelijking zelfstandig uitvoerbaar.
- Eerdere instellingen bewust gekozen en correct hergebruikt voor de weekorder.
- Nieuwe invoer wordt niet als reeds uitgevoerde uitkomst beoordeeld.
- Tijd, gemeten kwaliteit en vrijgave worden gezamenlijk en correct geïnterpreteerd.
- Besluit en nabespreking bereikbaar zonder docentomweg.
- Volledige koude ronde uitgevoerd op de definitieve build; ook een mislukte uitkomst eerlijk rapporteren.

Een goede UX-test vereist niet dat Qwen een optimale of geslaagde productieorder vindt. Een correct onderbouwd negatief leverbesluit kan inhoudelijk slagen. Wel moet het zelfstandig een gewenste nieuwe variant kunnen instellen, uitvoeren en beoordelen. Toets daarna met twee of drie echte deelnemers welke problemen mensen delen met Qwen.

Lever per mijlpaal een lokale commit: (1) concept/resultaat en herstel, (2) meetbewijs en deelnemersroute, (3) testprotocol en vastgelegde koude ronde. Bewaar nieuwe bewijzen in `docs/ux-qwen-v4/` en laat eerdere rondes intact.
