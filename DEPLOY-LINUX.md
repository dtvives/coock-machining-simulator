# Linux / LXC

De productie-interface is meegeleverd in frontend/dist. Node is alleen nodig om deze opnieuw te bouwen.

1. Installeer Python 3.14 met venv-ondersteuning.
2. Maak de omgeving: `python3.14 -m venv .venv`.
3. Installeer: `.venv/bin/python -m pip install -r requirements.lock.txt`.
4. Maak `deployment.env` met het werkelijke containeradres (onderstaand adres vervangen):

```sh
COOCK_ALLOWED_HOSTS='localhost,127.0.0.1,192.168.1.100'
COOCK_ALLOWED_ORIGINS='http://localhost:8766,http://127.0.0.1:8766,http://192.168.1.100:8766'
```

5. Start met `sh start-linux.sh`; open http://CONTAINER-IP:8766.
6. Test met `.venv/bin/python -m unittest discover -s tests`.

Voor een reverse proxy: voeg de externe host en exacte https-origin toe. Bind desgewenst met COOCK_BIND_HOST=127.0.0.1. Geen authenticatie ingebouwd; beperk bereik tot het bedoelde netwerk. Iedere browser bewaart zijn eigen oefening; verplaats bestaande oefeningen via JSON.

SSHFS draagt alleen bestanden over: installatie, processtart en een eventuele systemd-service moeten op de Linux-host gebeuren. Kopieer nooit de Windows-.venv naar Linux. Exacte reproductie op Linux is nog te verifiëren.
