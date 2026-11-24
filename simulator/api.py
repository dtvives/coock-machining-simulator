"""Single local API. All production calculations belong to the headless core."""
from pathlib import Path
import os
import csv
import io

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .engine import simulate
from .schemas import Settings
from .process import load_scenarios, get_scenario
from . import MODEL_VERSION

app = FastAPI(title="COOCK Verspaningsatelier", version=MODEL_VERSION)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=os.environ.get("COOCK_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(","))


@app.middleware("http")
async def local_requests(request: Request, call_next):
    # Browsers may read the app locally; cross-site POSTs must never drive it.
    origin = request.headers.get("origin")
    if request.method == "POST" and origin and origin not in set(os.environ.get("COOCK_ALLOWED_ORIGINS", "http://localhost:8766,http://127.0.0.1:8766,http://localhost:5173,http://127.0.0.1:5173").split(",")):
        return JSONResponse({"detail": "Aanvragen van een andere website zijn niet toegestaan."}, status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(_request, exc):
    fields = ", ".join(".".join(str(p) for p in e["loc"][1:]) for e in exc.errors())
    return JSONResponse(status_code=422, content={"detail": f"Controleer de invoer en toegestane grenzen: {fields}."})


@app.exception_handler(ValueError)
async def invalid_scenario(_request, exc):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/api/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION, "application": "coock-machining-simulator"}


@app.get("/api/scenarios")
def scenarios():
    return load_scenarios()


@app.post("/api/simulate")
def run(settings: Settings):
    return simulate(settings)


class Reproduction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    settings: Settings
    model_version: str
    scenario_snapshot: dict


@app.post("/api/reproduce")
def reproduce(saved: Reproduction):
    if saved.model_version != MODEL_VERSION:
        return JSONResponse(status_code=409, content={"detail": "Deze proef gebruikt een andere modelversie. Open ze met de oorspronkelijke appversie."})
    if saved.scenario_snapshot != get_scenario(saved.settings.scenario_id):
        return JSONResponse(status_code=409, content={"detail": "Het opgeslagen scenario verschilt van het geïnstalleerde scenario. Exact herhalen is niet mogelijk."})
    return simulate(saved.settings)


@app.post("/api/export/csv")
def export_csv(settings: Settings):
    result = simulate(settings)
    stream = io.StringIO(newline="")
    columns = ["number", "time_minutes", "ra_um", "diameter_mm", "wear", "good", "inspected", "observed_good", "tool_number", "age_on_edge", "inspection_kind", "observed_time_minutes"]
    writer = csv.DictWriter(stream, fieldnames=columns, delimiter=";", extrasaction="ignore")
    writer.writeheader()
    writer.writerows(result["parts"])
    return Response("\ufeff" + stream.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": 'attachment; filename="verspaning-stukken.csv"'})


@app.post("/api/export/summary")
def export_summary(settings: Settings):
    r = simulate(settings)
    s = r["summary"]
    cost = "niet gedefinieerd (geen goede stukken)" if s["cost_per_good_eur"] is None else f"€ {s['cost_per_good_eur']:.2f}"
    lines = ["# COOCK — proefsamenvatting", "", f"Scenario: {settings.scenario_id} · model {r['model_version']} · seed {settings.seed}",
             f"Instellingen: {settings.speed_m_min} m/min; {settings.feed_mm_rev} mm/omw; wissel om {settings.change_after_parts} stukken; inspectie om {settings.inspect_every} stukken.",
             f"Modus: {settings.mode}; opdracht: {settings.quantity}; wissel na gemeten afkeur: {settings.stop_on_reject}.",
             f"Vrijgavebeleid: {settings.release_policy}; inspectieverschuiving: {settings.inspection_offset} stukken.", "",
             f"Geproduceerd: {s['produced']}; werkelijk goed: {s['good']}; werkelijk afgekeurd: {s['rejected']}.",
             f"Geïnspecteerd: {s['inspected']}; gemeten afkeur: {s['detected_rejects']}; ongeïnspecteerd: {s['uninspected']}.",
             f"Snijkanten: {s['tools_used']}; wissels: {s['tool_changes']}; totale kost: € {s['total_cost_eur']:.2f}; kost per goed stuk: {cost}.",
             f"Snijtijd: {s['cutting_minutes']:.3f} min; gebruikte roostertijd: {s['working_minutes']:.3f} min; kalenderduur: {s['elapsed_minutes']:.3f} min.",
             f"Vrijgegeven (gemeten goed): {s['released']}; nog onbevestigd: {s['pending_release']}; aanvullende productie: {s['supplemental_produced']}; eindinspecties: {s['final_inspections']}.",
             f"Vrijgegeven order op tijd: {'ja' if s['release_on_time'] else 'nee'}; kost per vrijgegeven stuk: {s['cost_per_released_eur'] if s['cost_per_released_eur'] is not None else 'niet gedefinieerd'}.",
             f"Werkelijk goede orderhoeveelheid: {'ja' if s['on_time'] else 'nee'} (synthetische grondwaarheid).", "", "## Tijd per oorzaak (min)"]
    lines.extend(f"- {k}: {v:.3f}" for k, v in s["downtime_minutes"].items())
    lines += ["", "ROI-invoer: bovenstaande snijkanten, afkeur en stilstand zijn uitsluitend voor deze proefperiode. Vergelijk met een gelijke baseline; geen automatische jaaromrekening of dubbele waardering van vrijgekomen capaciteit.", "", "Leeromgeving met illustratieve slijtage- en kwaliteitsparameters. Geen gevalideerd snijparameteradvies. Werkelijke kwaliteit is synthetische grondwaarheid, niet volledig bekend uit steekproeven.", ""]
    return Response("\n".join(lines), media_type="text/markdown; charset=utf-8", headers={"Content-Disposition": 'attachment; filename="verspaning-samenvatting.md"'})


# Explicit API routes precede the static mount; production is a single origin.
DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
