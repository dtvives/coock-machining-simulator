# Verbeteropdracht — COOCK Machining Simulator

Voer de verbeteringen aan de bestaande workshopapp volledig uit in:

`C:\Software\COOCK Machining Simulator`

Lees eerst `BUILD_INSTRUCTIONS.md`, de toepasselijke `AGENTS.md`, `README.md`, `docs/MODEL.md`, `docs/WORKSHOP.md` en `docs/TEST_REPORT.md`. Behoud de bestaande architectuur en functionaliteit. Inspecteer de actuele code en Git-status; eerdere beoordelingen zijn aanwijzingen die je zelf moet verifiëren.

Werk zelfstandig zonder inhoudelijke feedback te vragen. Maak redelijke keuzes, documenteer belangrijke aannames compact en blijf itereren totdat de verbeteringen werken en getest zijn. Respecteer technische toegangsbeperkingen. Wijzig geen andere projecten, PLC’s of HMI-servers en publiceer niets extern.

## Doel

Maak de app geschikt voor een begeleide workshop met bedrijven. Prioriteit ligt bij betere kwaliteitsbeslissingen, duidelijke verklaringen en betrouwbare bewaring. Voeg geen sensoren, uitgebreide 3D of andere onnodige infrastructuur toe.

## 1. Maak kwaliteitsvrijgave een echte productiebeslissing

Momenteel stopt de weekorder wanneer geproduceerd minus gemeten afkeur het orderdoel bereikt. Verborgen afkeur kan achteraf een tekort opleveren, terwijl nog productietijd beschikbaar is.

Breid dit uit met een begrijpelijk kwaliteits- en vrijgavebeleid. Ondersteun minimaal:

- Het bestaande steekproefbeleid, met expliciete vermelding dat niet-geïnspecteerde stukken onbevestigd blijven.
- Een beleid met eindcontrole vóór vrijgave. Gevonden afkeur kan worden vervangen door aanvullende productie zolang de werkweek dit toelaat.
- Een expliciete reactie op gemeten afkeur, zoals een gereedschapswissel. Leg duidelijk vast welke stukken daarbij worden tegengehouden of opnieuw gecontroleerd.

Kies de eenvoudigste samenhangende uitvoering. Batchquarantaine is alleen nodig als deze daadwerkelijk in het beleid wordt gebruikt; vermijd een onvolledig uitgewerkt extra systeem.

Maak onderscheid tussen geproduceerd, geïnspecteerd, afgekeurd, onbevestigd, vrijgegeven en werkelijk goed. Definieer de categorieën en eventuele overlapping ondubbelzinnig. Gebruik verborgen simulatiekwaliteit nooit als informatie voor de productiebesturing.

Inspectie en aanvullende productie kosten tijd en geld. Voorkom dubbele inspectiekosten voor al geldig gecontroleerde stukken. Definieer het gedrag bij dienst- en weekeinde, inclusief onafgewerkte eindcontrole. Toon waarom een order wel of niet leverbaar is.

## 2. Verbeter de gereedschapsoefening

Verifieer de huidige voorgestelde vergelijking van wisselen na 8 en 40 stukken. In de eerdere beoordeling leverden beide 800 goede stukken op; daarmee werd vooral een kostenverschil zichtbaar.

Maak de oefening een vergelijking van minstens drie strategieën:

- Vroeg wisselen.
- Een economisch verdedigbaar interval.
- Te laat wisselen met aantoonbaar kwaliteitsrisico.

Bepaal geschikte waarden met het actuele model. Gebruik eerdere waarden zoals 8, 40 en 80 alleen als startpunt. Controleer meerdere seeds en beide kwaliteitsscenario’s.

Stem de opdrachttekst in de app, startinstellingen en begeleidershandleiding op elkaar af. Presenteer geen universeel optimaal interval. Laat deelnemers hun conclusie onderbouwen met kwaliteit, kosten en leverbaarheid.

## 3. Laat de visualisatie daadwerkelijk iets uitleggen

Het oppervlakteprofiel is nu een vaste tekening en de beitelanimatie staat los van productiegebeurtenissen.

Verbeter dit gericht:

- Laat voedingsafstand en profielhoogte zichtbaar veranderen met de gebruikte proefinstellingen.
- Toon eenheden, schaal of een duidelijke melding dat het profiel is uitvergroot.
- Maak onderscheid tussen ideaal geometrisch profiel en gesimuleerde eindkwaliteit met slijtage en spreiding.
- Toon de productiestappen laden/lossen, snijden, inspecteren, wisselen en wachten buiten de dienst.
- Maak zichtbaar bij welke proef en instellingen de visualisatie hoort, vooral wanneer de invoer inmiddels gewijzigd is.
- Ondersteun pauze en versneld afspelen zonder invloed op het resultaat.

Gebruik serverresultaten en gebeurtenissen als bron. Voeg geen tweede procesmodel in de frontend toe. Laat noodzakelijke profielgegevens door de rekenkern leveren; de frontend mag die uitsluitend tekenen en afspelen.

Houd het eenvoudig en leesbaar. Gedetailleerde materiaalafname of een volledige CNC-animatie is niet nodig.

## 4. Onderzoek en verklaar het effect van inspectiemomenten

Vaste inspectie-intervallen en vaste wisselintervallen kunnen ertoe leiden dat steeds dezelfde gereedschapsleeftijd wordt bemonsterd.

Onderzoek dit eerst met gerichte proeven. Maak vervolgens minimaal twee reproduceerbare meetplannen vergelijkbaar, bijvoorbeeld:

- Periodieke inspectie met een vast startmoment.
- Een verschoven startmoment of gecontroleerd gevarieerde inspectiemomenten.

Kies een begrijpelijke oplossing met een concrete leerfunctie. Houd bij een gerichte vergelijking het inspectiebudget zo gelijk mogelijk; verklaar afwijkingen.

Eventuele willekeur in het meetplan moet onafhankelijk zijn van fysische kwaliteitsvariatie. Het wijzigen van het meetplan mag geen andere fysieke kwaliteit genereren voor verder identieke stukken. Alleen extra meettijd en expliciete beslisregels mogen de productie beïnvloeden.

Voeg een korte oefening toe waarin deelnemers ontdekken waarom een gunstige steekproef niet automatisch een goed proces bewijst. Toon welke gereedschapsleeftijden daadwerkelijk zijn gemeten.

## 5. Borg bewaring en compatibiliteit

De bestaande app bewaart volledige proeven, modelversie en scenario-snapshot. Behoud die traceerbaarheid.

- Verhoog de modelversie wanneer de simulatiebetekenis verandert.
- Behandel oudere workshopbestanden expliciet: veilig lezen, gecontroleerd migreren of begrijpelijk weigeren met behoud van de huidige oefening.
- Claim geen exacte reproductie tussen verschillende modellen.
- Bewaar geen ongeldige tijdelijke invoer op een manier waardoor eerdere proeven verloren gaan.
- Behoud bescherming tegen beschadigde bestanden, volle opslag en onbedoeld verlies van de uitgangssituatie.
- Controleer dat exports overeenkomen met de geselecteerde opgeslagen proef.

## 6. Test de definitieve versie daadwerkelijk

Voeg betekenisvolle tests toe voor de gewijzigde logica. Controleer minstens:

- Tijd-, materiaal-, aantallen- en kostenbalansen.
- Eindcontrole, aanvullende productie en vrijgave.
- Geen dubbele inspectie van reeds gecontroleerde stukken.
- Geen vrijgave op basis van verborgen grondwaarheid.
- Dienst- en weekeinde tijdens inspectie, wissel en aanvullende productie.
- Een order die tijdig kan worden aangevuld en een order waarvoor dat niet meer lukt.
- Nul goede of vrijgegeven stukken.
- Reproduceerbaarheid en onafhankelijkheid van logging, meetplanrandomness en afspeelsnelheid.
- Oude, gewijzigde en beschadigde workshopbestanden.
- Ongeldige invoer en behoud van bestaande proeven.

Voer daarna de deelnemersflow uit in de browser, bij voorkeur Edge of Chrome:

1. Uitgangssituatie uitvoeren.
2. Verwachting noteren en één instelling wijzigen.
3. Resultaten vergelijken.
4. Gereedschaps- en meetbeleid vergelijken.
5. Eindcontrole en aanvullende productie uitvoeren.
6. Een volledige reeks bewaren.
7. Het app-tabblad sluiten en opnieuw openen.
8. De reeks heropenen en exact reproduceren.
9. CSV en samenvatting exporteren en controleren.
10. Dezelfde proef bij verschillende afspeelsnelheden bekijken.

Controleer de uiteindelijke build, dus na de laatste relevante wijziging. Test een normale desktopweergave en een smaller scherm. Inspecteer browserfouten en leesbaarheid van grafieken.

Als browserautomatisering door beveiliging wordt gestopt, respecteer dat. Voltooi onafhankelijke controles en beschrijf precies welke browsercontrole ontbreekt. Claim dan geen volledige acceptatie.

Echte gebruikerstests kunnen niet door jou worden vervangen. Lever daarvoor een kort protocol voor twee of drie deelnemers, met taken en observatiepunten. Het uitvoeren daarvan is geen reden om de technische oplevering uit te stellen.

## Werkwijze en oplevering

- Gebruik afgebakende subagents voor implementatie en onafhankelijke review waar nuttig.
- Wijs duidelijke bestandsverantwoordelijkheid toe en controleer de integratie zelf.
- Werk in bruikbare stappen en maak betekenisvolle lokale Git-commits.
- Geef korte voortgangsupdates zonder op antwoord te wachten.
- Houd documentatie compact en actualiseer bestaande bestanden.
- Werk `docs/TEST_REPORT.md` bij met verwachtingen, werkelijk waargenomen resultaten, gevonden problemen en hercontroles.
- Houd de startprocedure eenvoudig en normaal gebruik volledig lokaal en offline.

Lever bij afronding een beknopt verslag met:

- Wat functioneel is verbeterd.
- Startopdracht en lokale URL.
- Uitgevoerde automatische en browsercontroles.
- Compatibiliteit met bestaande opgeslagen oefeningen.
- Resterende beperkingen.
- Git-commits en of de server nog draait.

Start met inspectie en uitvoering. Blijf niet bij een plan: lever de verbeterde, samenhangende en geteste app op.
