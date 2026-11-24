# Model 2.0.0 — grenzen en aannames

Dit is een didactisch model, geen gevalideerde snijparameteradviseur. Geometrie en tijdrekening worden berekend; slijtage, kwaliteitsvariatie, kosten en neventijden zijn illustratieve scenarioparameters, niet empirisch geïdentificeerd voor C45 of een commerciële snijplaat.

## Bewerkingsrelaties

C45-as Ø30 → Ø24 over 80 mm, drie langsdraaigangen Ø28/26/24, telkens 1 mm radiaal. Elke gang heeft 2 mm aanloop; totaal 246 mm voedingsbeweging. Kopvlakken, opspannen en vrije G-code vallen buiten de oefening.

- `n = min(3500, 1000 vc/(πD))` omw/min, constant binnen elke cilindrische gang; D is bewerkte diameter.
- `tc = 82/(f n)` min per gang. Spilbegrenzing verlaagt werkelijke snijsnelheid en beïnvloedt ook slijtage.
- Volume `π/4 × (30²−24²) × 80/1000 = 20,36 cm³`; aanloop verwijdert geen materiaal.
- `Ra_geometrisch ≈ 1000 f²/(32r)` µm met neusradius r=0,8 mm.
- Taylor-achtig `T = 25 × (180/vc)^4 × (0,18/f)^0,35` snijminuten. Alle coëfficiënten zijn illustratief. Elke gang voegt `tc/T` slijtage toe; leeftijd blijft over stukken/diensten behouden, wissel reset naar nul. Slijtage boven 1 is geen gereedschapsbreukmodel.

Primaire technische bronnen, geraadpleegd 15 november 2026: [Mitsubishi Materials](https://www.mmc-carbide.com/permanent/courses/85/formulas.html), [KEYENCE](https://www.keyence.com/ss/products/measure-sys/machining/formula/cutting.jsp). Deze ondersteunen snelheids-, tijd- en geometrische piek-dalhoogterelaties, niet onze scenariocoëfficiënten. De aanvullende benadering `h ≈ f²/(8r)` en `Ra ≈ h/4` betreft een regelmatig ideaal voedingsprofiel; het is geen algemene omrekening van gemeten Rz/Rmax naar Ra.

## Synthetische kwaliteit en profiel

De conservatieve eindkwaliteit gebruikt slijtage aan het einde van het stuk:

- `Ra = max(0, Ra_geometrisch + 0,25 + 0,9 × slijtage³ + N(0;0,08))` µm.
- `D = 24 + 0,008 × slijtage² + N(0;0,003)` mm.
- Goed vereist zowel Ra als diameter binnen de scenario-eis.

De strengere case heeft dezelfde fysica, andere eisen en eigen startinstellingen. Grenzen: 80–300 m/min, 0,08–0,40 mm/omw, vaste geometrie. Geen chatter-, stroom-, kracht-, thermisch of meetonzekerheidsmodel.

`process.profile` levert 201 punten over een vaste horizontale breedte van 1 mm. Verticaal µm: per voedingsperiode `y = 1000 × afstand²/(2r)`, piekhoogte `1000 f²/(8r)`. Dit tekent ideale voedingssporen; het is geen gemeten oppervlaktelijn. Slijtage en spreiding staan apart in de eindkwaliteit en worden niet als willekeurige profieltextuur voorgesteld. De frontend tekent uitsluitend servergegevens en speelt reeds berekende gebeurtenissen af. Animatie/framerate zijn geen kerninvoer.

Iedere partnummer/seed-combinatie heeft een eigen pseudotoevalsstroom. De streamidentifier `machining-1.0.0` blijft bewust behouden voor fysisch vergelijkbare perturbaties: dit is een toevalsstroomversie, niet de versie van het volledige productiemodel. Inspectie, logging en tijdrekening verbruiken geen extra fysische toevalstrekkingen. Exact herhalen vereist dezelfde modelversie, scenario-snapshot, instellingen en ondersteunde Python-runtime.

## Tijd en meetplan

Vijf diensten van 480 min, start maandag t=0 en volgende diensten t=1440, 2880 enzovoort. Neventijd 0,8 min/stuk omvat laden/lossen, retour, positioneren en versnellen; inspectie 1,2 min, wissel 3 min. Eén gedeelde productieresource zonder parallelle inspectie. Buiten de dienst werkt niets. Operaties pauzeren en hervatten zonder extra opstartkosten; een echte snede stilleggen kan industrieel onaanvaardbaar zijn.

Een gedeeltelijke snede vrijdag levert geen stuk; tijd, slijtage en materiaal tellen wel. Een volledig gesneden stuk met onafgewerkte inspectie blijft geproduceerd en onbevestigd. Een gedeeltelijke wissel installeert geen nieuwe snijkant.

Het eerste stuk wordt altijd gemeten. Daarna worden de stukken met `nummer % inspect_every == inspection_offset` bemonsterd. Offset 0 geeft elk N-de stuk; de verschuiving moet in [0,N−1] liggen. Verschuiving verandert de bemonsterde snijkantleeftijd, geen fysische toevalsstroom. Door randstukken kan het meetbudget één verschillen: vergelijk ook het werkelijke aantal metingen.

Alleen voltooide inspectie onthult kwaliteit. Inspectie is een perfecte toets van synthetische grondwaarheid; echte kalibratie- en meetfouten ontbreken. `inspection_kind` is sample/final/null, `observed_time_minutes` het tijdstip van onthulling, `age_on_edge` het aantal met deze snijkant gesneden stukken.

Logging bewaart optionele gebeurtenissen zonder invloed op productie. `playback_events` blijft altijd beschikbaar voor presentatie, ook zonder logging. Daarin staan handling, cutting, inspection, tool_change en shift_wait.

## Vrijgave en aanvullende productie

Een proef maakt de gekozen bruto hoeveelheid. Met `release_policy=sample` stopt de week bij het nominale doel (geproduceerd min gemeten afkeur) of weekeinde. Onbekende stukken blijven onbevestigd; nominale acceptatie is geen vrijgave.

Met `release_policy=final` worden bij de nominale hoeveelheid alle nog onbekende stukken gecontroleerd. Reeds geldige steekproefmetingen worden nooit dubbel gedaan. Een gemeten tekort leidt tot aanvullende productie en opnieuw controle van alleen nieuwe onbekende stukken. De week stopt bij voldoende gemeten goede stukken of wanneer tijd ontbreekt. Een proef met eindcontrole controleert de vaste bruto reeks en vult niet aan.

Afkeur wordt individueel tegengehouden. Er is geen automatische batchquarantaine of herbewerking: het model veronderstelt geen kennis over de andere stukken van dezelfde snijkant. `stop_on_reject` betekent een snijkantwissel vóór de volgende snede, ook na afkeur in eindcontrole. De lopende eindcontrole wordt eerst afgewerkt. Een wissel corrigeert geen bestaande stukken. Alleen `observed_good` stuurt beslissingen; verborgen `good` wordt uitsluitend voor de nabespreking gebruikt.

Categorieën en overlap:

- `produced = released + detected_rejects + pending_release`.
- `inspected = released + detected_rejects`. Vrijgegeven is uitsluitend gemeten goed.
- `pending_release = uninspected = accepted_unverified`; geen vrijgave.
- `nominal_accepted = released + pending_release`; geen kwaliteitsbewijs.
- `good + rejected = produced` is de afzonderlijke verborgen grondwaarheid.
- `supplemental_produced` is de subset gemaakt na de eerste eindcontrole; `final_inspections` de subset afgeronde eindmetingen.
- `release_on_time` toetst gemeten vrijgave tegenover doel; `on_time` toetst afzonderlijk werkelijk goede output. Bij steekproeven kan het laatste slagen terwijl vrijgave onvoldoende is.

## Kosten en interpretatie

Machine inclusief bedieningsaandeel €75/uur over alle verbruikte diensttijd, inclusief inspectie en wissel. Buiten-diensttijd en ongebruikte capaciteit worden niet gefactureerd. Materiaal €4 per begonnen belading; €8 per geïnstalleerde snijkant inclusief de eerste. Dit zijn workshopaannames, geen actuele VIVES-tarieven. Geen afzonderlijke arbeidsbesparing of capaciteitsopbrengst: geen dubbeltelling.

Kost per goed stuk deelt totale kosten door werkelijk goede output; kost per vrijgegeven stuk deelt dezelfde kosten door gemeten vrijgave. Beide zijn null bij nul noemer, en mogen niet samen worden opgeteld. `working_minutes = cutting + handling + inspection + tool_change`; kalenderduur telt shift_wait erbij. `unused_minutes` is ongebruikte roostercapaciteit. Geen OEE en geen automatische jaaromrekening.

Versie 2 wijzigt productiebetekenis door vrijgave en meetbeleid. Oude model-1-resultaten mogen niet als exact gereproduceerd worden aangeboden. Synthetische regressietests bewijzen programmagedrag, geen empirische validiteit. Voor bedrijfsgebruik ontbreken gemeten standtijd, meetonzekerheid, processtabiliteit, vrijgaveprocedure en gecontroleerde proefstukken op eigen materiaal en machine.
