# Bouwinstructies — COOCK Machining Simulator

Je bouwt zelfstandig een werkende workshopapp in `C:\Software\COOCK Machining Simulator`.

Voer de opdracht volledig uit. Blijf niet bij een plan of prototypebeschrijving. Ik ben niet beschikbaar voor overleg. Maak redelijke keuzes, documenteer belangrijke aannames en werk in iteraties tot de toepassing bruikbaar en getest is. Vraag geen inhoudelijke feedback. Respecteer technische toegangsbeperkingen en verplichte goedkeuringen; omzeil die niet. Als een onderdeel geblokkeerd raakt, werk zelfstandig verder aan de overige onderdelen.

## Doel en context

We organiseren binnen COOCK+ 4.0 Maturiteitsversnelling een workshop voor bedrijven met verspanende machines. Deelnemers moeten ervaren hoe procesinstellingen, meetgegevens en gereedschapsbeleid samen de kwaliteit, productiviteit en kosten beïnvloeden.

Bouw een virtuele verspaningsmachine als praktische leeromgeving. De deelnemer krijgt een productieorder, kiest instellingen, voert proeven uit en verbetert zijn aanpak op basis van resultaten.

- Voormiddag: één bewerking onderzoeken en optimaliseren.
- Namiddag: een productieorder binnen een gesimuleerde werkweek uitvoeren, inclusief gereedschapsslijtage, kwaliteitscontrole en wissels.
- Tussen beide sessies is een netwerklunch.

We bouwen voorlopig zonder medewerking of data van Sirris. De app moet volledig zelfstandig werken.

Succes betekent dat een deelnemer begrijpt waarom een wijziging beter of slechter uitpakt, welke gegevens die conclusie ondersteunen en wat hij op zijn eigen machine zou moeten toetsen.

## Autonome werkwijze

- Inspecteer eerst de werkmap, toepasselijke instructies en beschikbare ontwikkelhulpmiddelen.
- Behoud bestaande bestanden en wijzigingen.
- Gebruik relevante beschikbare skills volgens hun instructies.
- Installeer ontbrekende gangbare ontwikkelafhankelijkheden waar toegestaan, bij voorkeur lokaal en met vastgelegde versies.
- Maak zelfstandig technische en inhoudelijke keuzes binnen deze opdracht.
- Gebruik indien beschikbaar subagents voor afgebakende implementatie- en reviewtaken. Wijs duidelijke bestandsverantwoordelijkheid toe en controleer de integratie zelf.
- Werk met Git. Initialiseer een repository als die ontbreekt en maak betekenisvolle lokale commits na werkende mijlpalen.
- Publiceer niets extern, maak geen betaalde accounts aan en gebruik geen diensten waarvoor nieuwe credentials nodig zijn.
- Wijzig geen andere projecten, PLC’s, TwinCAT-installaties of bestaande HMI-servers.
- Geef korte voortgangsupdates, maar wacht niet op mijn reactie.
- Leg resterende beperkingen eerlijk vast. Claim geen geslaagde controles die je niet hebt uitgevoerd.

## Technische richting

Gebruik bij voorkeur Python voor de headless simulatiekern, FastAPI als kleine lokale API en TypeScript met React voor de browserinterface. Gebruik versiebeheerde scenariobestanden; aanvankelijk geen database.

Verifieer actuele compatibiliteit en documentatie voordat je afhankelijkheden kiest. Houd de architectuur klein: geen microservices, Docker-verplichting, accountsysteem of onnodige infrastructuur.

De toepassing moet lokaal op Windows werken en via Edge of Chrome bruikbaar zijn. Voorzie een eenvoudige startprocedure, bij voorkeur één PowerShell-opdracht of startbestand. Bind standaard aan localhost. De workshop mag tijdens normaal gebruik geen internetverbinding nodig hebben.

Scheid minstens:

1. Bewerkings- en kwaliteitsmodellen.
2. Productiegebeurtenissen en tijdrekening.
3. Scenario’s en didactische opdrachten.
4. API en gebruikersinterface.

Alle berekeningen moeten zonder browser testbaar zijn. De interface mag geen tweede, afwijkende versie van de proceslogica bevatten.

## Afbakening van de eerste machine

Begin met langsdraaien van een eenvoudig cilindrisch werkstuk: één materiaal, één gereedschap met vervangbare snijkant, één vaste begin- en eindgeometrie, een vaste bewerkingsvolgorde en een vooraf ingesteld programma/recept.

Vrije G-code-invoer en een volledige CNC-besturing zijn niet nodig.

De drie belangrijkste instelbare keuzes zijn snijsnelheid, voeding per omwenteling en gereedschapswisselinterval. Voeg kwaliteitscontrolefrequentie toe voor de productieoefening. Breid andere instellingen alleen uit als ze een duidelijke leerfunctie hebben.

Kies zelf een plausibele, intern consistente voorbeeldcase. Benoem instellingen en eenheden ondubbelzinnig. Zorg dat materiaalafname, eindgeometrie, aantal gangen, bewegingstijd en machinegrenzen met elkaar kloppen.

## Simulatie en betrouwbaarheid

Maak onderscheid tussen direct berekende grootheden (bewegingstijd, aantallen, wisseltijd en kosten), onderbouwde vereenvoudigde modellen (bijvoorbeeld geometrische ruwheid en een standtijdrelatie) en didactische aannames (bijvoorbeeld spreiding en kwaliteitsverslechtering door slijtage).

Gebruik primaire technische bronnen voor inhoudelijke relaties waar mogelijk. Leg bronnen, eenheden, coëfficiënten en geldigheidsgrenzen compact vast. Verzin geen empirisch gevalideerde materiaal- of gereedschapscoëfficiënten. Wanneer betrouwbare waarden ontbreken, gebruik expliciet gemarkeerde illustratieve scenarioparameters.

De app is een leeromgeving, geen gevalideerde snijparameteradviseur.

- Begin met een deterministische kern.
- Gebruik vervolgens reproduceerbare toevalsvariatie met een vastlegbare seed.
- Dezelfde configuratie, modelversie en seed moeten dezelfde resultaten geven.
- Afspeelsnelheid en animatieframerate mogen de uitkomsten niet veranderen.
- Slijtage bouwt op en wordt correct gereset bij een nieuwe snijkant.
- Een resterende snijkantlevensduur moet correct over stukken heen worden meegenomen.
- Het model mag geen onverklaarbare negatieve tijden, kosten of aantallen produceren.
- Definieer wat gebeurt bij een onafgewerkt stuk, inspectie of gereedschapswissel op het einde van een dienst.
- Maak onderscheid tussen werkelijk gesimuleerde kwaliteit en kwaliteit die de deelnemer door inspectie kent.
- Het activeren van logging verandert uitsluitend de waarneming, niet de onderliggende fysische toestand.
- Een sensor levert alleen productiewinst wanneer een expliciete actie of beslisregel op de informatie volgt.

Vermijd circulaire validatie: een model is niet empirisch bevestigd doordat het zijn eigen synthetische data correct voorspelt.

Stroom, trillingen en chatter zijn uitbreidingen. Voeg ze alleen toe als ze coherent uit de procestoestand volgen en een concrete oefening ondersteunen. Geen willekeurige grafieken om technische diepgang te suggereren.

Stel gedetailleerde 3D-oppervlakken uit. Een eenvoudige bewegende beitel, een werkstukprofiel en een uitvergrote oppervlaktelijn volstaan aanvankelijk.

## Productiesimulatie en resultaten

Ondersteun één stuk of een korte proefreeks, een order binnen een werkrooster en een versnelde productieweek. Modelleer laden/lossen, bewerken, inspecteren en gereedschap wisselen. Stilstand komt voort uit expliciete gebeurtenissen. Vergelijk een uitgangssituatie met verbeterde strategieën.

Toon minstens:

- Bewerkingstijd en totale verstreken productietijd.
- Aantal geproduceerde, goede en afgekeurde stukken.
- Gereedschapsverbruik en wissels.
- Stilstand per oorzaak.
- Kost per goed stuk.
- Ordervoortgang en tijdige levering.
- Kwaliteitsverloop en gereedschapstoestand.

Gebruik kost per goed stuk en levering binnen kwaliteitseisen als centrale beoordelingscriteria.

OEE mag worden toegevoegd als verklarende indicator. Leg geplande productietijd, ideale cyclustijd en behandeling van afkeur en stilstand vooraf vast. Pas de referentie niet stilzwijgend aan per strategie. Toon benutting afzonderlijk waar nodig.

Vermijd dubbeltelling van vrijgekomen capaciteit, arbeidsbesparing en machinekosten. Behandel nul goede stukken expliciet.

## Gebruikerservaring

Maak een verzorgde, Nederlandstalige interface voor technisch geïnteresseerde deelnemers zonder programmeerkennis.

De hoofdflow moet onmiddellijk duidelijk zijn:

Opdracht begrijpen → instellingen kiezen → proef uitvoeren → vergelijken → volgende beslissing nemen.

Voorzie:

- Een korte opdrachtkaart met product, hoeveelheid, kwaliteitseis en beschikbare tijd.
- Begrijpelijke instellingen met eenheden, grenzen en korte toelichting.
- Een eenvoudige animatie van werkstuk en beitel.
- Een lokale uitvergroting van het oppervlakteprofiel als die de uitleg ondersteunt.
- Duidelijke grafieken met assen, eenheden en leesbare legenda’s.
- Een opgeslagen uitgangssituatie en vergelijking van meerdere proeven.
- Bewaren en opnieuw openen van scenario’s/resultaten.
- Export van relevante resultaten naar CSV en een leesbare samenvatting.
- Een veilige reset van de eigen oefening.
- Begrijpelijke foutmeldingen en lege toestanden.

Voorkom dat alles tegelijk zichtbaar is. Bied verdieping waar nodig. Houd ontwikkelinformatie uit de normale deelnemersflow.

Volledige 3D-materiaalafname is niet nodig. Een betrouwbare eenvoudige visualisatie heeft voorrang.

## Workshopinhoud

Lever minimaal twee uitgewerkte oefeningen met een startscenario en begeleidersnotities.

### Oefening 1 — Maak een goed stuk tegen een goede kost

1. Voer een uitgangssituatie uit.
2. Formuleer een verwachting.
3. Verander gericht één instelling.
4. Vergelijk kwaliteit, tijd en kosten.
5. Onderbouw de volgende proef.

### Oefening 2 — Lever een productieorder

1. Gebruik een gekozen procesinstelling.
2. Onderzoek slijtage en gereedschapswissels.
3. Kies een inspectiebeleid.
4. Vergelijk strategieën over een werkweek.
5. Beoordeel goede output, kosten en leverbaarheid.

Elke oefening eindigt met: Wat heb je geleerd? Welke waarneming ondersteunt dat? Welke informatie ontbreekt? Welke gecontroleerde proef zou je in je eigen bedrijf uitvoeren?

Zorg dat deelnemers een echte afweging maken. Ontwerp niet bewust één triviale instelling die onder alle omstandigheden wint.

## Latere aansluiting op de ROI-app

Er bestaat een ROI-verkenner:

https://melodious-pavlova-936dab.netlify.app/

Deze vergelijkt investeringen in onder meer gereedschapsbewaking en productiestatusmonitoring. De eerste versie van onze simulator mag hiervan niet afhankelijk zijn.

Voorzie een compacte exportsamenvatting met bijvoorbeeld gereedschapsverbruik, afkeur en stilstandsverschillen. Automatische API-koppeling en financiële investeringsanalyse zijn geen vereiste. Extrapoleer een week niet zonder expliciete aannames naar een jaar.

## Bouwvolgorde

1. Rekenkern: één consistente case met betekenisvolle tests.
2. Complete basisflow: instellingen invoeren, proef uitvoeren en resultaten bekijken in de browser.
3. Vergelijking: uitgangssituatie, alternatieven, bewaren/openen en export.
4. Productieorder: werkrooster, slijtage, wissels en inspectie.
5. Workshop: opdrachten, begeleidersnotities en begrijpelijke uitleg.
6. Verbeteriteraties: scenario’s uitvoeren, problemen oplossen en gebruiksgemak aanscherpen.

Maak de eerste complete flow vroeg werkend. Vermijd langdurig bouwen aan onderdelen zonder bruikbaar geheel.

## Zelfstandig testen vanuit deelnemersperspectief

Voer na de technische tests de volledige gebruikersflow werkelijk uit in de browser. Gebruik beschikbare browsertools en controleer fouten, grafieken, navigatie en zichtbare resultaten.

Test minstens:

- Een beginner die de standaardopdracht zonder hulp uitvoert.
- Een deelnemer die alleen cyclustijd probeert te minimaliseren.
- Een deelnemer die heel voorzichtig produceert en mogelijk zijn levering mist.
- Vroeg tegenover laat gereedschap wisselen.
- Frequente tegenover beperkte kwaliteitscontrole.
- Twee strategieën met vergelijkbare output maar verschillende kosten.
- Een order die niet binnen de beschikbare tijd past.
- Ongeldige of extreme invoer.
- Een proef zonder goede stukken.
- Bewaren, herladen en exact reproduceren van een resultaat.
- Dezelfde proef bij verschillende afspeelsnelheden.
- Andere seeds en scenario’s, zodat een toevallig gunstige run niet als algemene conclusie wordt gepresenteerd.

Leg per scenario kort vast: verwachting, waargenomen resultaat, probleem en eventuele verbetering. Pas de app aan en test opnieuw wanneer je een relevante tekortkoming ontdekt.

Automatische tests moeten gedrag en invarianten controleren, niet alleen de implementatie herhalen. Controleer onder meer tijd- en aantallenbalansen, eenheden, slijtage, kosten, reproduceerbaarheid en API-validatie.

Deze zelfstandige tests vervangen geen latere proef met echte deelnemers. Beschrijf ze niet als menselijke gebruikerstesten.

## Definitie van klaar

- De app start daadwerkelijk op deze Windows-pc en werkt in de browser.
- Beide workshopoefeningen zijn volledig uitvoerbaar.
- Resultaten zijn consistent, reproduceerbaar en uitlegbaar.
- Scenario’s kunnen bewaard, heropend en vergeleken worden.
- Relevante automatische tests en browsercontroles zijn uitgevoerd.
- De deelnemersscenario’s zijn doorlopen en belangrijke problemen opgelost.
- Een korte README legt startprocedure en bediening uit.
- Modellen, bronnen, aannames en beperkingen zijn compact gedocumenteerd.
- Er bestaan een korte workshophandleiding en een testverslag.
- De wijzigingen staan traceerbaar in Git.
- Geen kritieke bekende fout blokkeert de kernflow.

Lever bij afronding een beknopt verslag met de startopdracht, eventuele lokale URL, gerealiseerde functies, uitgevoerde controles en resterende beperkingen. Vermeld duidelijk of de app nog draait.

Start zelfstandig met inspectie en uitvoering. Neem normale ontwerpbeslissingen zelf en blijf itereren totdat een samenhangende, bruikbare en geteste workshopapp is opgeleverd.
