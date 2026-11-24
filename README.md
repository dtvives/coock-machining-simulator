# COOCK Verspaningsatelier

Lokale Nederlandstalige workshopapp: onderzoek één draaibewerking en lever daarna een order binnen vijf gesimuleerde werkdagen. Werkt zelfstandig, zonder Sirris-data of verbinding met een echte machine.

## Start met Docker

Voer in de projectmap `docker compose up -d --build --wait` uit en open
[het verspaningsatelier](http://127.0.0.1:8766). Stop de app met `docker compose down`.
De eerste build haalt de dependencies op en bouwt de webinterface.

Standaard is de app alleen bereikbaar op de Docker-host. Voor toegang vanaf het
lokale netwerk kun je de variabelen hieronder in een Compose-`.env`-bestand
zetten. Vervang het voorbeeldadres door het LAN-adres van de Docker-host.
Behoud `127.0.0.1` in de lijst met toegestane hosts voor de healthcheck.

```dotenv
COOCK_PUBLISH_HOST=192.168.1.100
COOCK_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
COOCK_ALLOWED_ORIGINS=http://localhost:8766,http://127.0.0.1:8766,http://192.168.1.100:8766
```

Met `COOCK_PORT` wijzig je de gepubliceerde poort. Pas bij een eigen lijst met
origins ook de poort in die lijst aan. De app heeft geen authenticatie.
Oefeningen worden in de browser bewaard en zijn via JSON overdraagbaar.

## Start op deze Windows-pc

Dubbelklik **Start-Workshop.cmd** of voer uit in PowerShell:

```powershell
.\Start-Workshop.ps1
```

Open **http://127.0.0.1:8766** in Edge of Chrome. Stop de server met Ctrl+C in het startvenster. Poort 8766 en alle simulaties blijven lokaal. Bestaande PLC's en HMI's worden niet benaderd.

Na een verse checkout: installeer Python 3.14 en Node.js 22.12+; voer eenmaal `.\Start-Workshop.ps1 -Install` uit met internet. Daarna werkt normaal gebruik offline. Python-versies staan exact vast in `requirements.lock.txt`; npm-versies in `frontend/package-lock.json`. Een `.venv` is pc-gebonden en hoort niet gekopieerd te worden.

## Bediening

Onder **01 Proef & productie** wissel je tussen **Proef voorbereiden** en **Resultaat beoordelen**. Wisselen bewaart je concept; simuleren opent de beoordeling. De knop **Proef instellingen** onder de reflectie kopieert de instellingen van het bekeken resultaat naar een nieuwe voorbereiding. Eerdere resultaten blijven behouden.

1. Kies de voormiddagproef of productieorder en lees de opdrachtkaart.
2. Voer de uitgangssituatie uit en bewaar ze als referentie.
3. Noteer een verwachting, wijzig gericht één instelling en voer opnieuw uit.
4. Vergelijk kwaliteit, kost per goed stuk en levering. Open de verdieping voor werkelijke synthetische kwaliteit tegenover gemeten kwaliteit.
   Kies voor de weekorder ook het vrijgavebeleid: steekproef laat onbevestigde stukken over; eindcontrole controleert onbekende stukken en vult gemeten tekorten aan zolang de week dit toelaat. Alleen gemeten goede stukken heten vrijgegeven.
5. Bewaar de volledige oefening als JSON. Open het bestand later opnieuw; de app herberekent en controleert de model- en scenarioversie. CSV bevat de stukken; de samenvatting is leesbare tekst.

De browser bewaart de oefening ook lokaal, gecomprimeerd. Een reeks bevat maximaal 12 proeven; bij een volle reeks blijft alles bewaard. Exporteer JSON en reset om een nieuwe reeks te beginnen. Gebruik JSON ook voor overdracht of langdurige bewaring. Wissen van browsergegevens verwijdert lokale opslag. Reset vraagt bevestiging.

Model 2.0.0 voegt vrijgave en verschoven inspectie toe. Bestanden uit model 1.0.0 kunnen niet exact door dit model worden herhaald; behoud ze en gebruik zo nodig de oorspronkelijke Git-versie. Een oude of ongeldige import mag de huidige oefening niet vervangen. De oppervlaktevisualisatie en het afspelen gebruiken servergegevens van de geselecteerde proef, niet de nog niet uitgevoerde invoer.

## Ontwikkeling en controle

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
cd frontend
npm run build
npm test
```

`simulator/process.py` bevat bewerkingsrelaties, `engine.py` productiegebeurtenissen, `scenarios/` versiebeheerde lesparameters en `api.py` de lokale API. React toont uitsluitend serverresultaten; de afspeelsnelheid beïnvloedt geen simulatie.

Zie [model en bronnen](docs/MODEL.md), [workshophandleiding](docs/WORKSHOP.md) en [testverslag](docs/TEST_REPORT.md). Dit is een leeromgeving met illustratieve slijtage- en kwaliteitsparameters, geen gevalideerde snijparameteradviseur. Industriële toepassing vraagt metingen op eigen materiaal, gereedschap en machine.

Voor een latere proef met twee of drie echte deelnemers: [pilotprotocol](docs/PILOT_PROTOCOL.md).
