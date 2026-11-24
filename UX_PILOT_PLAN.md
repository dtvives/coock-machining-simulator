# Gerichte vervolgstap en eerste deelnemerspilot

Datum: 15 november 2026. Status: implementatie en technische controles uitgevoerd. De voorlopige v6-test op `index-mFOFRvo4.js` vond een door de sticky balk afgedekte grafiekkop. De scrollcorrectie staat in commit `5e82ce0`, definitieve build `index-C_WHgAbk.js`; de nieuwe koude tests en verificatie zijn vastgelegd in `docs/ux-qwen-v7/`. V6-bewijs blijft intact. De definitieve volledige Qwen-test faalt inhoudelijk op een ongefundeerd positief leverbesluit; de ongunstige deeltest slaagt. Pilotmateriaal voorbereid in `docs/ux-pilot-v1/`; deelnemerspilot niet uitgevoerd. Annuleren van bestandskiezer blijft handmatig te controleren. Zie de verslagen voor de exacte uitkomst en grenzen.
Basis: commit `a378c69`, build `index-nKOybW84.js`, model 2.0.0.
Bewijs: [v5-rapport](docs/ux-qwen-v5/REPORT.md), [verificatie](docs/ux-qwen-v5/VERIFICATION.md) en de oorspronkelijke antwoorden in dezelfde map.

## 1. Analyse en besluit

De kernflow is voldoende stabiel om een kleine menselijke pilot voor te bereiden. Eerst enkele gerichte verduidelijkingen en het importhiaat sluiten; daarna deelnemers observeren voordat we de navigatie opnieuw verbouwen.

| Onderdeel | Laatste bewijs | Beoordeling |
|---|---|---|
| Starten | Volledige rol start onmiddellijk bij 1280×720 | Eerdere zoekfrictie in deze ronde verdwenen |
| Bronkeuze en weekorder | Onafhankelijke weektaak: 7 acties, juiste bron; volledige flow kiest eigen alternatief | Zelfstandige route aangetoond; eerdere popupbeperking niet meer blokkerend |
| Concept/resultaat | Klaarzetten en simuleren worden afzonderlijk uitgevoerd | Scheiding behouden |
| Vergelijken | Eén factor gewijzigd; kwaliteit, kosten en meetdekking gebruikt | Gewenst gedrag waargenomen |
| Besluit en onthulling | Afsluitdeeltest: 6 acties zonder extra proef; volledige rol gebruikt beoordelingsknop | Hergebruik/besluitverwarring niet herhaald |
| Volledige workshop | 14 acties; 800 vrijgegeven in 34,6/40 uur | Geslaagd binnen de gefaseerde testopzet, geen menselijke succesmeting |

De grootste resterende onzekerheid is inhoudelijk begrip, niet het aantal klikken:

- `week/04–05.json`: Qwen extrapoleert 3/10 vrijgegeven naar circa 4747 minuten. Het verwart meetdekking met een productierendement, maar corrigeert zijn besluit na de echte weekberekening.
- `week/06.json`: Qwen verwacht dat eindcontrole de 639 onbevestigde stukken bevestigt. Afkeur is dan nog onbekend. Beide weekroutes eindigen gunstig; omgaan met een ongunstige uitkomst is in v5 niet aangetoond.
- `full/17.json`: de kwaliteitscijfers zijn gelezen, maar de grafiek ligt deels onder de vouw. Onthullen is nog geen bewijs dat iemand het kwaliteitsverloop begrijpt.
- De afsluitdeeltest vindt de besluitsectie via scrollen. Dat is frictie, maar geen blokkade en geen reden om nu een andere navigatiestructuur te bouwen.
- Echte bestandsimport blijft onbevestigd. Twee vastgelopen toolpogingen bewijzen een beperking van de testverbinding, geen appdefect. Laden via testfixtures telt niet als importbewijs.

Methodische beperking: in fase A van de volledige test meldde Qwen nog `taak_klaar=false` en zocht het een besluitstap. De testleider ging verder omdat het meetbewijscriterium bereikt was. Dat is geen knopadvies, maar ook geen volledig zelfgestuurde overgang. De aantallen acties zijn beschrijvend; geen procentuele verbetering claimen tegenover v4. Eén model en één rol per taak geven geen menselijke succespercentages.

## 2. Werk vóór de pilot

### P1 — Twee korte verduidelijkingen bij het beslismoment

Eigenaar: ontwikkelaar. Inspecteer eerst bestaande tekst; vervang of verkort die waar mogelijk in plaats van waarschuwingen op te stapelen.

1. Bij steekproefresultaat en relevante vergelijking: **“3 van 10 vrijgegeven betekent hier: 3 gemeten goed en 7 nog onbekend. Het is geen afkeurpercentage. Bereken de weekorder met het gekozen meetbeleid.”** Gebruik actuele aantallen, geen vast voorbeeld in de app. Behoud de toelichting dat individuele vrijgave een simulatieregel is.
2. Bij eindcontrole klaarzetten: **“Eindcontrole kan afkeur vinden. Controle en eventuele aanvulling kosten tijd; 800 vrijgegeven binnen het rooster is niet gegarandeerd. Je berekent een nieuwe volledige ordervariant.”** Behoud het afzonderlijke uitvoermoment en het oude resultaat.

Acceptatie: tekst is zichtbaar bij de betreffende keuze op 1280×720, zonder extra modal of verplichte stap. Geen verborgen kwaliteit vooraf tonen. Geen wijziging van model, vrijgaveregels of bestaande proefgegevens. Controleer ook nul vrijgegeven stukken en gevonden afkeur; de uitleg mag dan niet suggereren dat alle niet-vrijgegeven stukken ongemeten zijn.

### P1 — Import werkelijk controleren op de workshop-pc

Eigenaar: technische tester; handmatig indien de ondersteunde bestandskiezerverbinding blijft blokkeren.

- Gebruik de echte productie-interface: actuele sessie exporteren, opnieuw openen en herberekenen; daarnaast een oude v2-sessie openen en herberekenen.
- Noteer build, browser, bestand, verwachte en werkelijke proefinstellingen, seed, modelversie en kernuitkomsten. Controleer per proef correct herstel van besluit/onthulling volgens het bestandsformaat, zonder overname van de eerder geopende sessie.
- Controleer annuleren en een ongeldig bestand: bestaande oefening blijft bruikbaar, melding is begrijpelijk, geen half geladen sessie.
- Leg screenshots en resultaatvergelijking vast. Cache-injectie of alleen API-tests sluiten dit punt niet. Wijzig de importcode uitsluitend bij een reproduceerbare appfout.

Acceptatie: beide bestandsformaten werkelijk geopend en passend bij hun modelversie reproduceerbaar; herstelgevallen zonder gegevensverlies. Zolang dit ontbreekt, blijft import expliciet open. Een lege-sessiepilot kan eventueel doorgaan, maar niet als volledige validatie van bewaren/openen worden gerapporteerd.

### P2 — Grafiek gericht vindbaar maken, verdere navigatie afwachten

Eigenaar: ontwikkelaar. Voeg na onthulling bij de kwaliteitssamenvatting een compacte actie **“Bekijk kwaliteitsverloop”** toe die de bestaande grafiek in beeld brengt en de regiokop focust. Geen automatische sprong die het oorspronkelijke besluit uit beeld duwt. Toon de actie pas als onthulling is toegestaan.

Acceptatie: bereikbaar met toetsenbord; geen nieuwe proef of gewijzigde inspectie/vrijgave; legenda en assen leesbaar op 1280×720. Controleer de gewijzigde routes op 600×900. Behoud native bronkeuze en bestaande beoordelingsactie. Beslis pas na de pilot over vaste navigatie, een wizard of verplaatsing van de besluitsectie.

## 3. Technische controle en begrensde Qwen-regressie

Eigenaar: ontwikkelaar/tester. Bestaande referentie: 41 Python- en 17 frontendtests plus productiebuild geslaagd. Run passende controles opnieuw na wijzigingen; voeg alleen gedragstests voor nieuwe interacties toe. Test starten, vergelijken, besluitfocus, onthulling, sessieherstel en import op de definitieve build. Houd foutinjectie op een geïsoleerde testserver.

Bevries daarna één build. Gebruik het v5-schermprotocol, één browseroperator, vaste viewport, verse Qwen-rollen en alleen zichtbaar schermbewijs. Bewaar onder `docs/ux-qwen-v6/`:

1. **Eén volledige koude flow** vanuit een lege oefening, inclusief onderbouwd besluit en uitleg van één waarneming uit de grafiek.
2. **Eén ongunstige weektaak** vanuit een gecontroleerde fixture waarin afkeur en/of roosteruitputting voorkomt. Verifieer de fixture vooraf met de rekenkern; kies geen willekeurige seed in de hoop op afkeur. Qwen krijgt geen verwachte conclusie. Vraag of de order geleverd kan worden en waarop dat oordeel steunt. Een juist negatief besluit slaagt; een gunstige einduitkomst is niet vereist.

Leg vóór beide tests per fase het inhoudelijke eindcriterium vast. Ga verder zodra Qwen zelf afrondt én het criterium bereikt is. Bij tegenstrijdigheid één neutrale vraag: “Ben je klaar met deze opdracht?” Registreer die interventie; geen stilzwijgende taakovergang. Behoud maximaal 12 acties per fase en stoppen na drie herhalingen zonder voortgang. Een technische blokkade apart rapporteren.

Acceptatie: geen blijvende verwarring tussen onbekend en afgekeurd; geen positieve leverconclusie zonder voldoende vrijgave én tijd; eindcontrole wordt niet als garantie behandeld; grafiekuitleg bevat een concrete waarneming. Een fout of blokkade rapporteren en classificeren, niet herhaald testen tot toevallig een goede rol verschijnt. Deze twee tests begrenzen de regressieronde; menselijke observatie is de volgende stap.

## 4. Eerste pilot met echte deelnemers

Voorstel: drie individuele sessies van 45–60 minuten, met mensen die verspaningsmachines kennen maar deze app en de eerdere rapporten niet. Varieer ervaring met instellen en kwaliteitscontrole. Geen ontwikkelaar als vervanging voor een deelnemer. Projectleider bevestigt deelnemers, begeleider, pc en datum; er is nog niets ingepland.

Gebruik dezelfde bevroren build, lege sessie en beginsituatie per deelnemer. Werk op de beoogde Windows-workshop-pc met de beoogde browser; registreer viewport, zoom en modelversie. Controleer vooraf lokaal starten en normale werking zonder internet. Eén begeleider observeert; een tweede notulist indien beschikbaar. Individueel testen voorkomt dat deelnemers elkaar de route leren.

Introductie, circa 3 minuten: “We testen de app, niet jou. Gebruik wat je op het scherm ziet. Vertel wat je probeert te bereiken en wat je verwacht.” Geen demonstratie, README, knopnamen of uitleg over de vrijgavelogica vooraf.

### Taakkaarten — één voor één aanbieden

| Taak | Letterlijke opdracht | Observatiecriterium voor begeleider |
|---|---|---|
| A | Voer een eerste proef met tien assen uit. Vertel wat je nu over hun kwaliteit weet en wat nog onzeker is. | Start vinden; gemeten goed, afkeur en ongemeten onderscheiden |
| B | Onderzoek of je goedkoper kunt produceren door één instelling te veranderen. Vergelijk met je eerste proef en onderbouw je conclusie. | Eén factor; juiste proeven; prijs én bewijs meenemen |
| C | Onderzoek of je 800 vrijgegeven assen kunt leveren in vijf diensten van acht uur. Kies een aanpak en onderbouw je leverbesluit. | Bronkeuze; concept uitvoeren; tijd én vrijgave; geen gegarandeerde eindcontrole veronderstellen |
| D | Leg je besluit vast. Bekijk daarna wat de simulator over de volledige kwaliteit laat zien. Licht één waarneming uit het kwaliteitsverloop toe en vertel of je conclusie verandert. | Besluit vóór onthulling; grafiek vinden en interpreteren; onthulling niet verwarren met vrijgave |
| E | Bewaar je werk en open het opnieuw, zodat je er later mee kunt verdergaan. | Echte export/import; juiste sessie en resultaten herkennen |

Reserveer circa 30–40 minuten voor A–E en 10 minuten voor nabespreking. Gebruik een aparte ongunstige gevalstaak alleen als daar tijd voor is; registreer die als aanvullende taak, niet als deel van de koude hoofdflow.

### Observeren zonder voorzeggen

- Noteer per taak start/eindtijd, eerste actie, verkeerde verwachting met letterlijk citaat, herstel, hulp en resultaat. Tijden zijn diagnostisch; hardop denken beïnvloedt ze.
- Na circa 90 seconden zonder voortgang: “Wat probeer je nu te bereiken?” Label neutrale interventies **N**. Bij expliciete hulpvraag of na circa drie minuten vastlopen: label routehint **H**, leg de hint vast en markeer het resterende taakdeel als geholpen. Geen succes achteraf als zelfstandig tellen. Technische onderbreking label **T**.
- Scheid **bediening** van **begrip**: een juiste knop met een onjuiste leverconclusie is geen inhoudelijk succes. Een negatief leverbesluit met correct bewijs kan wel slagen.
- Vraag na de taken: “Wat betekent vrijgegeven hier?”, “Wat kan eindcontrole veranderen?”, “Wat bewijst onthulling op een echte machine niet?” en “Welke gecontroleerde proef zou je op je eigen machine nodig hebben?” Geen modelantwoorden vooraf geven.
- Gebruik P01–P03 en alleen noodzakelijke observaties. Persoonlijke notities blijven buiten Git en Qwen; in het project komt een geanonimiseerde bevindingentabel. Opnames alleen volgens vooraf afgesproken toestemming en bewaartermijn; de projectleider verifieert de toepasselijke VIVES-afspraken vóór werving/opname.

Registratiesjabloon:

`Deelnemercode | taak | duur | zelfstandig/geholpen/gestopt | N/H/T | citaat/gedrag | inhoudelijk juist? | herstel | ernst | bewijsverwijzing`

## 5. Beslissen na de pilot

Dit zijn vooraf gekozen werkcriteria voor een kleine formatieve pilot, geen statistische claim:

- **Doorgaan naar een grotere workshop:** geen gegevensverlies of blokkerende kernfout; ten minste twee van drie deelnemers doorlopen A–D zonder routehint; alle drie geven vóór inhoudelijke uitleg een correct eindbeeld van meetonzekerheid en leverbaarheid. Importstatus afzonderlijk vermelden.
- **Gericht herstellen:** één onjuist positief leverbesluit, verwarring tussen onthulling en vrijgave, of technisch gegevensverlies krijgt directe analyse, ook als het maar eenmaal voorkomt. Dezelfde niet-kritieke navigatiefrictie bij twee deelnemers rechtvaardigt een gerichte wijziging.
- **Afwachten:** incidenteel scrollen of een modelgebonden Qwen-fout zonder menselijk equivalent rechtvaardigt geen grotere herbouw.

Na een relevante wijziging: passende technische regressie en bevestiging met één of twee nieuwe deelnemers voor het gewijzigde pad. Eerdere deelnemers zijn niet meer koud. Houd builds en resultaten gescheiden.

Lever één compact `docs/ux-pilot-v1/REPORT.md` met observaties, onderscheid app/taakbrief/testomgeving/domeinkennis, prioriteit, eigenaar en besluit per bevinding. Rapporteer aantallen personen, geen schijnprecisie in percentages. De pilot toetst bruikbaarheid en leerbegrip; empirische validatie van snijparameters blijft een afzonderlijke onderzoeksopgave.

## 6. Uitvoervolgorde en afronding

1. Ontwikkelaar: korte uitleg en grafiekroute; afzonderlijke implementatiecommit.
2. Tester: echte import en technische regressie; bewijs vastleggen.
3. Tester: twee koude Qwen-tests op definitieve build; rapport met afwijkingen en open punten.
4. Projectleider/begeleider: pilot organiseren en uitvoeren met drie nieuwe deelnemers.
5. Team: bevindingen prioriteren en beslissen over een gerichte correctie of bredere workshop.

Niet automatisch deelnemers contacteren of een uitgevoerde pilot claimen. Dit plan is klaar zodra analyse, taken en criteria zijn vastgelegd; uitvoering en menselijke beschikbaarheid zijn afzonderlijke vervolgstappen. Bewaar v1–v5-bewijzen intact.
