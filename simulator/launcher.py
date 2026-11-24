"""Start the local server; open the default browser only after readiness."""
import argparse
import json
import threading
import time
import urllib.error
import urllib.request
import webbrowser

import uvicorn

URL = "http://127.0.0.1:8766"


def open_when_ready():
    for _ in range(40):
        try:
            with urllib.request.urlopen(URL + "/api/health", timeout=1) as response:
                health = json.load(response)
            if health.get("application") == "coock-machining-simulator":
                webbrowser.open(URL)
                return
        except (OSError, urllib.error.URLError, ValueError):
            pass
        time.sleep(.25)


def main():
    parser = argparse.ArgumentParser(description="COOCK lokaal verspaningsatelier")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    if not args.no_browser:
        threading.Thread(target=open_when_ready, daemon=True).start()
    uvicorn.run("simulator.api:app", host="127.0.0.1", port=8766)


if __name__ == "__main__":
    main()
