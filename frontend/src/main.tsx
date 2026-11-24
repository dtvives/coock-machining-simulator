import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Part, Result, Run, Scenario, Session, Settings } from "./types";
import { decodeCache, encodeCache } from "./cache.js";
import { validSettings, persistableSession } from "./settings.js";
import { createRunId } from "./run-id.js";
import "./style.css";
import {
  reuseSettings,
  recordDecision,
  orderStatus,
  validDecisionHistory,
  discloseRuns,
  changeGroups,
  trialTitle,
  initialView,
  measurementEvidence,
  calculateTrial,
} from "./ux.js";
import { Machine, Surface, Sampling } from "./visuals";

const DEFAULT: Settings = {
  scenario_id: "steel-shaft",
  mode: "trial",
  speed_m_min: 180,
  feed_mm_rev: 0.18,
  change_after_parts: 20,
  inspect_every: 5,
  quantity: 10,
  seed: 42,
  logging: true,
  stop_on_reject: false,
  release_policy: "sample",
  inspection_offset: 0,
};
const KEY = "coock-workshop-v1";
const number = (n: number, d = 1) =>
  Number.isFinite(n)
    ? n.toLocaleString("nl-BE", { maximumFractionDigits: d })
    : "—";
const euro = (n: number | null) =>
  n === null
    ? "Geen goede stukken"
    : new Intl.NumberFormat("nl-BE", {
        style: "currency",
        currency: "EUR",
      }).format(n);
function samplingExplanation(result: Result): string {
  const { released, produced, detected_rejects, uninspected } = result.summary;
  return `${released} van ${produced} vrijgegeven betekent hier: ${released} gemeten goed, ${detected_rejects} gemeten afkeur en ${uninspected} nog onbekend. De vrijgaveverhouding is geen afkeurpercentage. Bereken de weekorder met het gekozen meetbeleid.`;
}
function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (k) =>
            JSON.stringify(k) +
            ":" +
            stable((value as Record<string, unknown>)[k]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
function validateSession(value: unknown): Session {
  if ((value as { format?: string })?.format === "coock-workshop-v1")
    throw Error(
      "Bestand uit model 1: open met de oorspronkelijke appversie. Je huidige oefening blijft behouden; model 2 rekent oude resultaten niet stilzwijgend om.",
    );
  const s = value as Session;
  if (
    !s ||
    s.format !== "coock-workshop-v2" ||
    !validSettings(s.settings) ||
    !Array.isArray(s.runs) ||
    s.runs.length > 12 ||
    typeof s.prediction !== "string" ||
    typeof s.reflection !== "string" ||
    (s.baseline !== null && typeof s.baseline !== "string")
  )
    throw Error(
      "Dit is geen ondersteund workshopbestand of de instellingen zijn ongeldig (maximaal 12 proeven).",
    );
  const ids = new Set<string>();
  for (const r of s.runs) {
    if (
      !r ||
      typeof r.id !== "string" ||
      ids.has(r.id) ||
      typeof r.name !== "string" ||
      typeof r.prediction !== "string" ||
      typeof r.reflection !== "string" ||
      !validSettings(r.result?.settings) ||
      !r.result.scenario_snapshot ||
      !r.result.summary ||
      !Array.isArray(r.result.parts) ||
      r.result.model_version !== "2.0.0" ||
      !Array.isArray(r.result.playback_events) ||
      !r.result.process?.profile ||
      !Array.isArray(r.result.process?.rpm_by_pass)
    )
      throw Error("Het bestand bevat een onvolledige of ongeldige proef.");
    for (const value of Object.values(r.result.summary))
      if (typeof value === "number" && !Number.isFinite(value))
        throw Error("Het bestand bevat ongeldige resultaten.");
    if (
      typeof r.result.scenario_snapshot.title !== "string" ||
      typeof r.result.summary.downtime_minutes !== "object" ||
      r.result.summary.downtime_minutes === null
    )
      throw Error("Het bestand bevat ongeldige opdrachtgegevens.");
    const numericSummary = [
      "released",
      "pending_release",
      "supplemental_produced",
      "final_inspections",
      "produced",
      "good",
      "rejected",
      "inspected",
      "detected_rejects",
      "uninspected",
      "nominal_accepted",
      "accepted_unverified",
      "tools_used",
      "tool_changes",
      "cutting_minutes",
      "elapsed_minutes",
      "working_minutes",
      "available_minutes",
      "total_cost_eur",
      "order_target",
      "completion_fraction",
      "final_wear",
      "unused_minutes",
    ] as const;
    if (
      numericSummary.some((key) => !Number.isFinite(r.result.summary[key])) ||
      !r.result.parts.every(
        (p) =>
          p &&
          Number.isFinite(p.number) &&
          Number.isFinite(p.ra_um) &&
          Number.isFinite(p.diameter_mm) &&
          Number.isFinite(p.wear) &&
          typeof p.good === "boolean" &&
          typeof p.inspected === "boolean" &&
          Number.isFinite(p.tool_number),
      )
    ) {
      throw Error("Het bestand bevat ontbrekende meetwaarden of resultaten.");
    }
    if (
      typeof r.result.summary.release_on_time !== "boolean" ||
      (r.result.summary.cost_per_released_eur !== null &&
        (!Number.isFinite(r.result.summary.cost_per_released_eur) ||
          r.result.summary.cost_per_released_eur < 0)) ||
      !Array.isArray(r.result.process.profile.points) ||
      !r.result.process.profile.points.every(
        (p) => Number.isFinite(p.x_mm) && Number.isFinite(p.y_um),
      ) ||
      !Number.isFinite(r.result.process.profile.width_mm) ||
      r.result.process.profile.width_mm <= 0 ||
      !Number.isFinite(r.result.process.profile.height_um) ||
      !r.result.playback_events.every(
        (e) =>
          typeof e.kind === "string" &&
          Number.isFinite(e.start_minutes) &&
          e.start_minutes >= 0 &&
          Number.isFinite(e.duration_minutes) &&
          e.duration_minutes > 0,
      ) ||
      !r.result.parts.every(
        (p) =>
          Number.isInteger(p.age_on_edge) &&
          p.age_on_edge >= 1 &&
          (p.inspection_kind === null || typeof p.inspection_kind === "string"),
      )
    )
      throw Error(
        "Het bestand bevat ongeldige vrijgave-, profiel- of afspeelgegevens.",
      );
    if (!validDecisionHistory(r))
      throw Error("Ongeldige of tegenstrijdige besluitgeschiedenis.");
    ids.add(r.id);
  }
  if (s.baseline !== null && !ids.has(s.baseline))
    throw Error("De uitgangssituatie ontbreekt in het bestand.");
  return s;
}
function initialSession(): {
  session: Session;
  error: string;
  warning?: string;
} {
  let error = "";
  try {
    const text = localStorage.getItem(KEY);
    if (text) {
      let decoded = decodeCache(text) as Session;
      const recoveredSettings =
        decoded &&
        typeof decoded === "object" &&
        !validSettings(decoded.settings);
      if (recoveredSettings) decoded = { ...decoded, settings: { ...DEFAULT } };
      return {
        session: validateSession(decoded),
        error,
        warning: recoveredSettings
          ? "Je eerdere invoer was onvolledig. Alle geldige proeven zijn hersteld; de invoervelden gebruiken opnieuw de startinstellingen."
          : "",
      };
    }
  } catch {
    error =
      "Je eerdere browseropslag kon niet worden geopend en blijft ongewijzigd. Automatisch bewaren is tijdelijk gestopt om die gegevens te beschermen. Bewaar je nieuwe werk als bestand, open een geldig workshopbestand of reset de oefening bewust.";
  }
  return {
    session: {
      format: "coock-workshop-v2",
      settings: DEFAULT,
      runs: [],
      baseline: null,
      prediction: "",
      reflection: "",
    },
    error,
  };
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail);
    } catch {}
    throw Error(
      response.status === 422
        ? "Controleer de invoer. " + detail
        : "De berekening kon niet worden uitgevoerd. " + detail,
    );
  }
  return response.json();
}

function Plot({
  parts,
  limit,
  reveal,
  wear = false,
}: {
  parts: Part[];
  limit: number;
  reveal: boolean;
  wear?: boolean;
}) {
  const width = 650,
    height = 205,
    left = 58,
    top = 18,
    right = 20,
    bottom = 40;
  const shown = wear ? parts : parts.filter((p) => reveal || p.inspected);
  const maxY = wear
    ? Math.max(1.2, ...parts.map((p) => p.wear))
    : Math.max(limit * 1.25, ...shown.map((p) => p.ra_um));
  const maxX = Math.max(1, ...parts.map((p) => p.number));
  const px = (n: number) => left + (n / maxX) * (width - left - right);
  const py = (n: number) =>
    height - bottom - (n / maxY) * (height - top - bottom);
  return (
    <svg
      className="plot"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={
        wear
          ? "Theoretisch verbruik van de snijkant per stuk"
          : reveal
            ? "Werkelijke oppervlakteruwheid per stuk"
            : "Gemeten oppervlakteruwheid van geïnspecteerde stukken"
      }
    >
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <path
            d={`M${left} ${py(maxY * v)}H${width - right}`}
            stroke="#e0e6df"
          />
          <text x={left - 8} y={py(maxY * v) + 4} textAnchor="end">
            {number(maxY * v, 1)}
          </text>
        </g>
      ))}
      <text x="15" y="18">
        {wear ? "Verbruiksindex" : "Ra (µm)"}
      </text>
      <path
        d={`M${left} ${py(wear ? 1 : limit)}H${width - right}`}
        stroke="#ba6034"
        strokeDasharray="6 4"
      />
      <text
        x={width - right}
        y={py(wear ? 1 : limit) - 6}
        textAnchor="end"
        fill="#a5532b"
      >
        {wear ? "Standtijdreferentie" : "Kwaliteitsgrens"}
      </text>
      {shown.map((p) => (
        <circle
          key={p.number}
          cx={px(p.number)}
          cy={py(wear ? p.wear : p.ra_um)}
          r={parts.length > 300 ? 1.6 : 3}
          fill={wear ? "#286e60" : p.good ? "#286e60" : "#c35e32"}
        >
          <title>{`Stuk ${p.number}: ${wear ? number(p.wear, 2) : number(p.ra_um, 2) + " µm"}${p.inspected ? " · gemeten" : ""}`}</title>
        </circle>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text
          key={v}
          x={px(Math.round(maxX * v))}
          y={height - 20}
          textAnchor="middle"
        >
          {Math.round(maxX * v)}
        </text>
      ))}
      <text x={width / 2} y={height - 2} textAnchor="middle">
        Stuknummer
      </text>
      {!shown.length && (
        <text x={width / 2} y={height / 2} textAnchor="middle">
          Nog geen meting beschikbaar
        </text>
      )}
    </svg>
  );
}

function App() {
  const [initial] = useState(initialSession);
  const [session, setSession] = useState<Session>(initial.session);
  const lastValidSettings = useRef(initial.session.settings);
  const [cacheBlocked, setCacheBlocked] = useState(Boolean(initial.error));
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [active, setActive] = useState<string | null>(
    session.runs.at(-1)?.id ?? null,
  );
  const [tab, setTab] = useState<"atelier" | "compare" | "guide">("atelier");
  const [nextSettingsId, setNextSettingsId] = useState<string | null>(null);
  useEffect(() => {
    if (tab === "compare") setNextSettingsId(active);
  }, [tab, active]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initial.warning ?? "");
  const [reveal, setReveal] = useState(false);
  const [speed, setSpeed] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1,
  );
  const [decision, setDecision] = useState("");
  const [decisionSaved, setDecisionSaved] = useState(false);
  const [view, setView] = useState<"concept" | "result">(() => initialView(initial.session.settings, initial.session.runs.at(-1)?.result.settings));
  const [sourceId, setSourceId] = useState<string | null>(session.runs.at(-1)?.id ?? null);
  const [prepared, setPrepared] = useState<string | null>(null);
  const resultPanel = useRef<HTMLElement>(null);
  const decisionPanel = useRef<HTMLDivElement>(null);
  const qualityHeading = useRef<HTMLHeadingElement>(null);
  const [focusResult, setFocusResult] = useState(false);
  useEffect(() => {
    if (focusResult && tab === "atelier") {
      const panel = document.getElementById("workshop-panel");
      panel?.scrollIntoView({ block: "start" });
      document.getElementById("subtab-result")?.focus({ preventScroll: true });
      setFocusResult(false);
    }
  }, [focusResult, tab, active]);
  useEffect(() => {
    setReveal(false);
    setDecision("");
    setDecisionSaved(false);
  }, [active]);
  const [reset, setReset] = useState(false);
  const [name, setName] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const settings = session.settings;
  const scenario = scenarios.find((s) => s.id === settings.scenario_id);
  const run = session.runs.find((r) => r.id === active) ?? session.runs.at(-1);
  const nextSettingsRun = session.runs.find((r) => r.id === nextSettingsId) ?? run;
  const result = run?.result ?? null;
  const source = session.runs.find((r) => r.id === sourceId);
  const groupedChanges = source ? changeGroups(source.result.settings, settings) : {task: [], process: []};
  const showResult = view === "result" && !busy && Boolean(result);
  function editConcept() {
    if (run) { reuse(run); return; }
    setView("concept");
    requestAnimationFrame(() => {
      const el = document.getElementById("concept-card");
      el?.scrollIntoView({ block: "start" }); el?.focus({ preventScroll: true });
    });
  }
  function sourceSelector() {
    if (!nextSettingsRun) return null;
    return <div className="next-order">
      <label>Instellingen voor volgende proef
        <select value={nextSettingsRun.id} onChange={(e) => setNextSettingsId(e.target.value)}>
          {session.runs.map((r, i) => <option key={r.id} value={r.id}>{i + 1}. {r.name} · {r.result.settings.speed_m_min} m/min · {number(r.result.settings.feed_mm_rev, 2)} mm/omw · {r.result.settings.quantity} stuks · {r.result.settings.release_policy === "final" ? "eindcontrole" : "steekproef"}</option>)}
        </select>
      </label>
      <p>Vergelijkingsreferentie verandert alleen de vergelijking. Deze bron bepaalt de nieuwe instellingen.</p>
      <button onClick={() => reuse(nextSettingsRun)}>Instellingen overnemen voor nieuwe proef: {nextSettingsRun.name}</button>
      <button onClick={() => reuse(nextSettingsRun, "week")}>Productieorder met instellingen van {nextSettingsRun.name}</button>
    </div>;
  }
  const baseline = session.runs.find((r) => r.id === session.baseline);
  const compatible =
    baseline &&
    result &&
    baseline.result.settings.mode === result.settings.mode &&
    baseline.result.settings.scenario_id === result.settings.scenario_id &&
    baseline.result.settings.quantity === result.settings.quantity &&
    stable(baseline.result.scenario_snapshot) ===
      stable(result.scenario_snapshot) &&
    baseline.result.model_version === result.model_version;
  useEffect(() => {
    api<Scenario[]>("/api/scenarios")
      .then(setScenarios)
      .catch(() =>
        setError(
          "Geen verbinding met de lokale simulator. Start de app met Start-Workshop.ps1 en vernieuw deze pagina.",
        ),
      );
  }, []);
  const [saveStatus, setSaveStatus] = useState("Bezig met lokaal bewaren…");
  useEffect(() => {
    if (cacheBlocked) return;
    try {
      if (validSettings(session.settings))
        lastValidSettings.current = session.settings;
      localStorage.setItem(
        KEY,
        encodeCache(persistableSession(session, lastValidSettings.current)),
      );
      setSaveStatus("Automatisch bewaard in deze browser.");
    } catch {
      setSaveStatus("Niet lokaal bewaard. Gebruik Bewaar bestand.");
      setNotice(
        "Automatisch bewaren lukt niet. Gebruik Bewaar bestand om je oefening te behouden.",
      );
    }
  }, [session, cacheBlocked]);
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setView("concept");
    setPrepared(null);
    if (key === "inspect_every" && Number.isFinite(value)) {
      setSession((s) => ({
        ...s,
        settings: {
          ...s.settings,
          inspect_every: Number(value),
          inspection_offset: Math.min(
            s.settings.inspection_offset,
            Math.max(0, Number(value) - 1),
          ),
        },
      }));
      return;
    }
    setSession((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  }
  function chooseScenario(id: string) {
    setView("concept");
    setPrepared(null);
    const chosen = scenarios.find((s) => s.id === id);
    setSession((s) => ({
      ...s,
      settings: {
        ...DEFAULT,
        ...chosen?.defaults,
        mode: s.settings.mode,
        quantity: s.settings.mode === "week" ? 800 : 10,
        scenario_id: id,
      },
    }));
    setNotice(
      "Startinstellingen van de gekozen opdracht geladen. Eerdere proeven blijven bewaard.",
    );
  }
  async function execute() {
    if (!validSettings(settings) || busy) { setError("Controleer de instellingen voordat je simuleert."); return; }
    if (session.runs.length >= 12) {
      setError(
        "Je oefening bevat 12 proeven. Bewaar eerst het workshopbestand en reset daarna de oefening voor een nieuwe reeks. Alle bestaande proeven blijven behouden.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const calculated = await calculateTrial(settings, (submitted) => api<Result>("/api/simulate", submitted));
      const id = createRunId();
      const newRun: Run = {
        id,
        name: name.trim() || `Proef ${session.runs.length + 1}`,
        prediction: session.prediction,
        reflection: "",
        result: calculated,
      };
      setSession((s) => ({
        ...s,
        reflection: "",
        runs: [...s.runs, newRun],
        baseline: s.baseline ?? id,
      }));
      setActive(id);
      setSourceId(id);
      setView("result");
      setPrepared(null);
      setFocusResult(true);
      setName("");
      setReveal(false);
      setNotice(
        "Proef uitgevoerd en lokaal bewaard. Vergelijk je verwachting met de metingen.",
      );
    } catch (e) {
      setView("concept");
      setError("Berekening mislukt. Je instellingen en eerdere proeven blijven behouden. " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportResult(kind: "csv" | "summary") {
    if (!result || !run?.revealedAt) return;
    try {
      const checked = await api<Result>("/api/reproduce", {
        settings: result.settings,
        model_version: result.model_version,
        scenario_snapshot: result.scenario_snapshot,
      });
      if (stable(checked) !== stable(result)) {
        throw Error(
          "Deze opgeslagen proef wijkt af van de huidige berekening. Open de oorspronkelijke appversie voor een exacte export.",
        );
      }
      const r = await fetch(`/api/export/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.settings),
      });
      if (!r.ok) throw Error("Export kon niet worden gemaakt.");
      download(
        `coock-${run?.name.replace(/[^\p{L}\p{N}-]/gu, "-")}.${kind === "csv" ? "csv" : "md"}`,
        await r.text(),
        kind === "csv"
          ? "text/csv;charset=utf-8"
          : "text/markdown;charset=utf-8",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function importSession(f: File) {
    setBusy(true);
    setError("");
    try {
      if (f.size > 30_000_000)
        throw Error("Het bestand is te groot (maximaal 30 MB).");
      const restored = validateSession(JSON.parse(await f.text()));
      for (const r of restored.runs) {
        const reproduced = await api<Result>("/api/reproduce", {
          settings: r.result.settings,
          model_version: r.result.model_version,
          scenario_snapshot: r.result.scenario_snapshot,
        });
        if (stable(reproduced) !== stable(r.result))
          throw Error(
            `Proef “${r.name}” kan niet exact worden gereproduceerd. Je huidige oefening blijft behouden.`,
          );
      }
      if (!scenarios.some((s) => s.id === restored.settings.scenario_id))
        throw Error("De geselecteerde opdracht is hier niet beschikbaar.");
      setSession(restored);
      setSourceId(restored.runs.at(-1)?.id ?? null);
      setView(initialView(restored.settings, restored.runs.at(-1)?.result.settings));
      setReveal(false);
      setDecision("");
      setDecisionSaved(false);
      setPrepared(null);
      setCacheBlocked(false);
      setError("");
      setActive(restored.runs.at(-1)?.id ?? null);
      setNotice(`${restored.runs.length} proeven geopend en exact nagerekend.`);
    } catch (e) {
      setError("Openen mislukt: " + (e as Error).message);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  function exportDelta() {
    if (!baseline?.revealedAt || !run?.revealedAt || !result || !compatible)
      return;
    const b = baseline.result.summary,
      s = result.summary;
    download(
      "coock-vergelijking-roi.csv",
      "Indicator;Uitgangssituatie;Gekozen strategie;Verschil\n" +
        [
          ["Snijkanten", b.tools_used, s.tools_used],
          ["Afkeur (simulatie)", b.rejected, s.rejected],
          ["Goede stukken (simulatie)", b.good, s.good],
          ["Werktijd (min)", b.working_minutes, s.working_minutes],
          [
            "Wisseltijd (min)",
            b.downtime_minutes.tool_change ?? 0,
            s.downtime_minutes.tool_change ?? 0,
          ],
          [
            "Inspectietijd (min)",
            b.downtime_minutes.inspection ?? 0,
            s.downtime_minutes.inspection ?? 0,
          ],
          ["Totale kost (EUR)", b.total_cost_eur, s.total_cost_eur],
        ]
          .map(
            (row) =>
              `${row[0]};${row[1]};${row[2]};${Number(row[2]) - Number(row[1])}`,
          )
          .join("\n") +
        "\nAlleen deze gesimuleerde periode. Geen extrapolatie of investeringsrendement.",
      "text/csv;charset=utf-8",
    );
  }
  function reuse(r: Run, purpose: "same" | "week" | "final" = "same") {
    setSession((s) => ({
      ...s,
      settings: reuseSettings(r.result.settings, purpose),
    }));
    setSourceId(r.id);
    setTab("atelier");
    setView("concept");
    setPrepared(
      `Instellingen van ${r.name} klaargezet${purpose === "final" ? " met eindcontrole" : purpose === "week" ? " voor 800 stuks" : ""}. Huidig resultaat blijft ${run?.name ?? r.name}. De nieuwe proef simuleert de volledige order vanaf het begin, met een nieuw volledig rooster. De vorige proef wordt niet voortgezet.${purpose === "final" ? ` Eindcontrole kan afkeur vinden. Controle en eventuele aanvulling kosten tijd; ${reuseSettings(r.result.settings, purpose).quantity} vrijgegeven binnen het rooster is niet gegarandeerd.` : ""}`,
    );
    setNotice(
      `Instellingen van ${r.name} geladen${purpose === "week" ? " voor 800 stuks" : purpose === "final" ? " met eindcontrole" : ""}. Voer bewust een nieuwe proef uit.`,
    );
    requestAnimationFrame(() => {
      const start = document.querySelector<HTMLElement>(".workshop-story");
      start?.scrollIntoView({ block: "center" });
      start?.focus({ preventScroll: true });
    });
  }
  function revealQuality() {
    if (!run) return;
    setSession((s) => ({
      ...s,
      runs: s.runs.map((r) =>
        r.id === run.id
          ? { ...r, revealedAt: r.revealedAt ?? new Date().toISOString() }
          : r,
      ),
    }));
    setReveal(true);
  }
  function mode(m: Settings["mode"]) {
    setView("concept");
    setPrepared(null);
    setSession((s) => ({
      ...s,
      settings: { ...s.settings, mode: m, quantity: m === "week" ? 800 : 10 },
    }));
  }
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("atelier");
          }}
        >
          <span className="brand-mark">
            C<span>+</span>
          </span>
          <span>
            COOCK+<small>4.0 MATURITEITSVERSNELLING</small>
          </span>
        </a>
        <div className="top-caption">Van proefstuk naar productie-inzicht</div>
        <span className="local">● Lokaal atelier</span>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">HET VERSPANINGSATELIER</div>
            <h1>Van proefstuk naar productie-inzicht</h1>
            <p>
              Ontdek wat snelheid, voeding en gereedschapsbeleid doen met
              kwaliteit, levertijd en kost.
            </p>
          </div>
          <p className="model-note">Illustratieve leeromgeving · geen snijparameteradvies voor je machine.</p>
        </section>
        <nav className="nav" aria-label="Hoofdnavigatie">
          <button
            className={tab === "atelier" ? "active" : ""}
            onClick={() => setTab("atelier")}
          >
            01 <b>Proef & productie</b>
          </button>
          <button
            className={tab === "compare" ? "active" : ""}
            onClick={() => setTab("compare")}
          >
            02 <b>Vergelijk proeven</b>
            <span>{session.runs.length}</span>
          </button>
          <button
            className={tab === "guide" ? "active" : ""}
            onClick={() => setTab("guide")}
          >
            03 <b>Opdrachten & uitleg</b>
          </button>
          <div className="file-actions">
            <button
              title="Het bestand bevat werkelijke simulatiekwaliteit. Bewaren telt als onthulling voor alle opgenomen proeven."
              onClick={() => {
                const exported = {
                  ...session,
                  settings: validSettings(session.settings)
                    ? session.settings
                    : lastValidSettings.current,
                  runs: discloseRuns(session.runs),
                };
                download(
                  `coock-${(run?.name || "workshop").replace(/[^a-zA-Z0-9_-]+/g, "-")}.json`,
                  JSON.stringify(exported, null, 2),
                  "application/json",
                );
                setSession(exported);
                setNotice(
                  "Bestand bewaard, inclusief werkelijke simulatiekwaliteit. Latere besluiten tellen als na onthulling/export.",
                );
              }}
            >
              Bewaar bestand ↓ (bevat simulatiekwaliteit)
            </button>
            <button disabled={busy} onClick={() => file.current?.click()}>
              Open bestand ↑
            </button>
            <input
              ref={file}
              type="file"
              accept=".json,application/json"
              aria-label="Open workshopbestand"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importSession(f);
              }}
            />
          </div>
        </nav>
        {cacheBlocked && (
          <div className="message error" role="alert">
            {initial.error}
            <button
              onClick={() => {
                const raw = localStorage.getItem(KEY);
                if (raw)
                  download(
                    "coock-beschermde-browseropslag.txt",
                    raw,
                    "text/plain",
                  );
              }}
            >
              Beschermde opslag downloaden
            </button>
          </div>
        )}
        {error && (
          <div className="message error" role="alert">
            {error}
            <button aria-label="Melding sluiten" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}
        {notice && (
          <div className="message" role="status">
            {notice}
            <button aria-label="Melding sluiten" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        {tab === "atelier" && (
          <>
            <div className="workshop-subtabs" role="tablist" aria-label="Proef en productie">
              {(["concept", "result"] as const).map((target, index) => (
                <button key={target} id={`subtab-${target}`} role="tab"
                  aria-selected={view === target} aria-controls="workshop-panel"
                  tabIndex={view === target ? 0 : -1}
                  disabled={busy || (target === "result" && !result)}
                  onClick={() => setView(target)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const next = event.key === "Home" ? "concept" : event.key === "End" ? "result" : index === 0 ? "result" : "concept";
                    if (next === "result" && !result) return;
                    setView(next);
                    requestAnimationFrame(() => document.getElementById(`subtab-${next}`)?.focus());
                  }}>
                  {target === "concept" ? "Proef voorbereiden" : "Resultaat beoordelen"}
                </button>
              ))}
            </div>
            <div id="workshop-panel" role="tabpanel" aria-labelledby={`subtab-${view}`}>
            {!showResult && <section tabIndex={-1} className="card workshop-story">
              <h2>{settings.mode === "week" ? "Lever een productieorder binnen vijf werkdagen" : "Onderzoek hoe je een afstandsas beter maakt"}</h2>
              <p>Je maakt cilindrische afstandsassen uit C45-staal. Kies hoe de draaibank snijdt en wanneer je de snijkant vervangt en stukken meet.</p>
              <p>{settings.mode === "week" ? "Onderzoek of je de order binnen het rooster kunt leveren. Onderbouw je besluit met tijd en vrijgegeven aantal uit de weekberekening." : "Voer een proef uit en bekijk kwaliteit, tijd en kosten. Verander daarna gericht één instelling en vergelijk je proeven om te ontdekken welke aanpak beter werkt."}</p>
            </section>}
            <div className={`work-layout ${showResult ? "result-view" : "concept-view"}`}>
              {!showResult && <aside className="settings card">
                <fieldset disabled={busy} className="settings-fields"><div className="section-label">01 — JOUW OPDRACHT</div>
                <div className="segmented" aria-label="Oefening">
                  <button
                    className={settings.mode === "trial" ? "selected" : ""}
                    onClick={() => mode("trial")}
                  >
                    Proefreeks
                  </button>
                  <button
                    className={settings.mode === "week" ? "selected" : ""}
                    onClick={() => mode("week")}
                  >
                    Productieweek
                  </button>
                </div>
                <label>
                  Voorbeeldcase
                  <select
                    value={settings.scenario_id}
                    onChange={(e) => chooseScenario(e.target.value)}
                  >
                    {scenarios.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                {scenario && (
                  <div className="order">
                    <b>Cilindrische as · {scenario.material}</b>
                    <p>
                      Ø {scenario.initial_diameter_mm} →{" "}
                      {scenario.final_diameter_mm} mm · lengte{" "}
                      {scenario.length_mm} mm
                    </p>
                    <div>
                      <span>Ruwheid</span>
                      <b>Ra ≤ {number(scenario.ra_limit_um, 2)} µm</b>
                    </div>
                    <div>
                      <span>Diameter</span>
                      <b>
                        {scenario.final_diameter_mm} ±{" "}
                        {number(scenario.diameter_tolerance_mm, 3)} mm
                      </b>
                    </div>
                    <div>
                      <span>Beschikbaar</span>
                      <b>
                        {settings.mode === "week"
                          ? `${scenario.days} × ${scenario.shift_minutes / 60} uur`
                          : "Korte proefreeks"}
                      </b>
                    </div>
                  </div>
                )}
                <form
                  id="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void execute();
                  }}
                >
                  <div className="section-label subsection">
                    02 — KIES INSTELLINGEN
                  </div>
                  <label>
                    Snijsnelheid <span>m/min</span>
                    <input
                      type="number"
                      min="80"
                      max="300"
                      step="1"
                      required
                      value={
                        Number.isFinite(settings.speed_m_min)
                          ? settings.speed_m_min
                          : ""
                      }
                      onChange={(e) =>
                        update("speed_m_min", e.target.valueAsNumber)
                      }
                    />
                    <small>80–300 · sneller snijden kost standtijd.</small>
                  </label>
                  <label>
                    Voeding per omwenteling <span>mm/omw</span>
                    <input
                      type="number"
                      min="0.08"
                      max="0.4"
                      step="0.01"
                      required
                      value={
                        Number.isFinite(settings.feed_mm_rev)
                          ? settings.feed_mm_rev
                          : ""
                      }
                      onChange={(e) =>
                        update("feed_mm_rev", e.target.valueAsNumber)
                      }
                    />
                    <small>0,08–0,40 · meer voeding verkort de beweging.</small>
                  </label>
                  <div className="two-fields">
                    <label>
                      Vervang snijkant na <span>stukken</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        step="1"
                        required
                        value={
                          Number.isFinite(settings.change_after_parts)
                            ? settings.change_after_parts
                            : ""
                        }
                        onChange={(e) =>
                          update("change_after_parts", e.target.valueAsNumber)
                        }
                      />
                    </label>
                    <label>
                      Meet elk <span>stuk</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        step="1"
                        required
                        value={
                          Number.isFinite(settings.inspect_every)
                            ? settings.inspect_every
                            : ""
                        }
                        onChange={(e) =>
                          update("inspect_every", e.target.valueAsNumber)
                        }
                      />
                    </label>
                  </div>
                  <label>
                    {settings.mode === "week"
                      ? "Orderdoel"
                      : "Aantal proefstukken"}{" "}
                    <span>stuks</span>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      required
                      value={
                        Number.isFinite(settings.quantity)
                          ? settings.quantity
                          : ""
                      }
                      onChange={(e) =>
                        update("quantity", e.target.valueAsNumber)
                      }
                    />
                  </label>
                  <label>
                    Vrijgavebeleid
                    <select
                      value={settings.release_policy}
                      onChange={(e) =>
                        update(
                          "release_policy",
                          e.target.value as Settings["release_policy"],
                        )
                      }
                    >
                      <option value="sample">
                        Steekproef: rest blijft onbevestigd
                      </option>
                      <option value="final">
                        Eindcontrole en aanvullende productie
                      </option>
                    </select>
                    <small>
                      Eindcontrole controleert onbekende stukken éénmaal.
                      Tekorten worden aangevuld zolang het rooster toelaat.
                    </small>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={settings.stop_on_reject}
                      onChange={(e) =>
                        update("stop_on_reject", e.target.checked)
                      }
                    />
                    <span>
                      Na gemeten afkeur: snijkant vóór volgend stuk wisselen
                    </span>
                  </label>
                  <details>
                    <summary>Verdieping: meetmoment, seed en logging</summary>                  <label>
                    Verschuiving meetmoment <span>stukken</span>
                    <input
                      type="number"
                      min="0"
                      max={Math.max(0, settings.inspect_every - 1)}
                      step="1"
                      required
                      value={
                        Number.isFinite(settings.inspection_offset)
                          ? settings.inspection_offset
                          : ""
                      }
                      onChange={(e) =>
                        update("inspection_offset", e.target.valueAsNumber)
                      }
                    />
                    <small>
                      0 tot meetinterval − 1. Het eerste stuk wordt altijd
                      gemeten; daarna bepaalt de verschuiving de periodieke
                      steekproef.
                    </small>
                  </label>

                    <label>
                      Toevalsseed
                      <input
                        type="number"
                        min="0"
                        max="2147483647"
                        step="1"
                        required
                        value={
                          Number.isFinite(settings.seed) ? settings.seed : ""
                        }
                        onChange={(e) => update("seed", e.target.valueAsNumber)}
                      />
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={settings.logging}
                        onChange={(e) => update("logging", e.target.checked)}
                      />
                      <span>Proceslogging bewaren</span>
                    </label>
                    <p className="hint">
                      De seed bepaalt de reproduceerbare toevalsvariatie. Logging bewaart productiegebeurtenissen, geen extra kwaliteitsmetingen, en verandert de productie niet. Alleen de expliciete
                      wisselregel kan op een meting ingrijpen. Dezelfde
                      instellingen, modelversie en seed geven hetzelfde
                      resultaat.
                    </p>
                  </details>
                  {result && stable(settings) !== stable(result.settings) && (
                    <p className="warning-text">
                      Invoer wijkt af van {run?.name}. Uitvoeren maakt een
                      nieuwe proef.
                    </p>
                  )}
                </form></fieldset>
              </aside>}
              <div className="workspace">
                {!showResult && <div className="card hypothesis">
                  <div className="section-label">
                    03 — MAAK JE VERWACHTING EXPLICIET
                  </div>
                  <div className="two-fields">
                    <label>
                      Naam van de volgende proef (optioneel)
                      <input
                        value={name}
                        maxLength={80}
                        placeholder={`Proef ${session.runs.length + 1}`}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      Wat verwacht je te verbeteren? (optioneel)
                      <input
                        value={session.prediction}
                        maxLength={1000}
                        placeholder="Ik verwacht dat … omdat …"
                        onChange={(e) =>
                          setSession((s) => ({
                            ...s,
                            prediction: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <p className="hint">
                    Verander eerst één instelling. Houd de seed gelijk voor een
                    gerichte vergelijking; herhaal daarna met andere seeds.
                  </p>
                  <section id="concept-card" tabIndex={-1} className="concept-card" aria-label="Nieuwe proef voorbereiden">
                    <h2>{busy ? "Berekening bezig" : "Nieuwe proef — nog niet uitgevoerd"}</h2>
                    <p>Bron: {source ? `${session.runs.indexOf(source) + 1}. ${source.name}` : "startinstellingen"}. Doel: {settings.quantity} stuks · {settings.speed_m_min} m/min · {number(settings.feed_mm_rev, 2)} mm/omw.</p>
                    <p>{settings.release_policy === "final" ? "Eindcontrole en aanvulling" : "Steekproef"} · {settings.mode === "week" ? `${scenario?.days ?? 5} diensten, volledig nieuw rooster` : "korte proefreeks"} · seed {settings.seed}.</p>
                    <p>Simuleert de volledige proef vanaf het begin. Eerdere resultaten en uren worden niet voortgezet.</p>
                    {prepared && <p role="status">{prepared}</p>}
                    {groupedChanges.task.length > 0 && <p>Andere opdracht: {groupedChanges.task.join(" · ")}</p>}
                    {groupedChanges.process.length > 0 && <p>Instellingen gewijzigd tegenover bron: {groupedChanges.process.join(" · ")}</p>}
                    {groupedChanges.process.length > 1 && <p className="hint">Meerdere proces- of beleidsfactoren gewijzigd: de oorzaak van een verschil is moeilijker te isoleren.</p>}
                    <button id="execute-start" type="submit" form="settings-form" className="primary" disabled={busy || !scenarios.length || !validSettings(settings)}>{busy ? "Bezig met berekenen…" : "Simuleer deze proef"}</button>
                    {run && <button type="button" disabled={busy} onClick={() => {setView("result"); setFocusResult(true);}}>Bekijk vorige uitkomst: {run.name}</button>}
                  </section>
                </div>}
                {showResult && result ? (
                  <>
                {showResult && <div className="visual-card">
                  <h2>Bekijk de bewerking en het voedingsprofiel</h2><Machine result={result} speed={speed} onSpeedChange={setSpeed} />
                  {result && (
                    <p className="hint">
                      Weergave van {run?.name} · {result.settings.speed_m_min}{" "}
                      m/min · {result.settings.feed_mm_rev} mm/omw.{" "}
                      {stable(settings) !== stable(result.settings) && (
                        <b>
                          De invoer is gewijzigd; voer een nieuwe proef uit om
                          dit beeld bij te werken.
                        </b>
                      )}
                    </p>
                  )}
                  <Surface result={result} />
                </div>}
                    <section
                      ref={resultPanel}
                      tabIndex={-1}
                      className="results card"
                      aria-label="Proefresultaten"
                    >
                      <div className="result-heading">
                        <div>
                          <div className="section-label">
                            04 — LEES JE RESULTAAT
                          </div>
                          <h2>{trialTitle(session.runs.findIndex((r) => r.id === run?.id), run?.name)}</h2>
                        </div>
                        <span
                          className={
                            result.settings.mode === "week" &&
                            !result.summary.release_on_time
                              ? "badge warning"
                              : "badge"
                          }
                        >
                          {result.settings.mode === "week"
                            ? orderStatus(result.summary)
                            : "Proefresultaat"}
                        </span>
                      </div>
                      <div className="result-actions">
                        <button className="primary" onClick={() => {
                          decisionPanel.current?.scrollIntoView({block: "start"});
                          decisionPanel.current?.focus({preventScroll: true});
                        }}>Beoordeel deze proef</button>
                        <button className="primary" onClick={() => {
                          setTab("compare");
                          requestAnimationFrame(() => document.querySelector(".comparison")?.scrollIntoView({ block: "start" }));
                        }}>
                          Vergelijk proeven
                        </button>
                        <small>Vergelijk je uitgevoerde proeven op tijd, gemeten kwaliteit en kost.</small>
                      </div>
                      <p className="measured-evidence"><b>Gemeten goed: {measurementEvidence(result.summary).good} / {result.summary.inspected}</b> · Gemeten afkeur: {result.summary.detected_rejects} · Ongemeten: {result.summary.uninspected}</p>
                      {result.settings.release_policy === "sample" && (
                        <p className="hint">{samplingExplanation(result)}</p>
                      )}
                      {result.settings.mode === "week" && (
                        <div className="order-status" aria-label="Orderstatus">
                          <b>
                            {run?.name}: {orderStatus(result.summary)}
                          </b>
                          <p>
                            Werktijd:{" "}
                            {number(result.summary.working_minutes / 60)} van{" "}
                            {number(result.summary.available_minutes / 60)} uur
                            gebruikt ·{" "}
                            {number(result.summary.unused_minutes / 60)} uur
                            rooster over
                          </p>
                          <p>
                            Geproduceerd: {result.summary.produced}/
                            {result.summary.order_target} · Vrijgegeven:{" "}
                            {result.summary.released}/
                            {result.summary.order_target} · Onbevestigd:{" "}
                            {result.summary.pending_release}
                          </p>
                          <small>
                            Deze simulator telt alleen individueel gemeten goede
                            stukken als vrijgegeven. Dit is een simulatieregel,
                            geen algemene industriële verplichting.
                          </small>
                          {!result.summary.release_on_time && (
                            <>
                              <p>Eindcontrole kan afkeur vinden. Controle en eventuele aanvulling kosten tijd; {result.summary.order_target} vrijgegeven binnen het rooster is niet gegarandeerd. Je berekent een nieuwe volledige ordervariant.</p>
                              <button onClick={() => run && reuse(run, "final")}>
                                Zet deze order klaar met eindcontrole
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {result.summary.detected_rejects > 0 && (
                        <p className="prepared" role="status">
                          <b>{result.summary.detected_rejects} gemeten stukken afgekeurd.</b> Onderzoek procesinstellingen of inspectiebeleid. Extra inspectie maakt afgekeurde stukken niet goed; eindcontrole kan afkeur alleen vinden en zo nodig aanvullende productie laten uitvoeren.
                        </p>
                      )}
                      <p className="result-config">
                        {result.scenario_snapshot.title} ·{" "}
                        {result.settings.mode === "week"
                          ? "Weekorder"
                          : "Proefreeks"}{" "}
                        · doel {result.settings.quantity} stuks ·{" "}
                        {number(result.settings.speed_m_min)} m/min ·{" "}
                        {number(result.settings.feed_mm_rev, 2)} mm/omw · wissel
                        na {result.settings.change_after_parts} stuks · meting
                        elke {result.settings.inspect_every} stuks · seed{" "}
                        {result.settings.seed} · meetverschuiving{" "}
                        {result.settings.inspection_offset} stuks ·{" "}
                        {result.settings.release_policy === "final"
                          ? "Eindcontrole en aanvulling"
                          : "Steekproef zonder eindvrijgave"}
                      </p>
                      <div className="kpis">
                        <div>
                          <span>Totale kost</span>
                          <strong>{euro(result.summary.total_cost_eur)}</strong>
                          <small>van deze gesimuleerde reeks</small>
                        </div>
                        <div>
                          <span>Geproduceerd</span>
                          <strong>
                            {result.summary.produced}
                            <i> stuks</i>
                          </strong>
                          <small>
                            {result.summary.inspected} geïnspecteerd ·{" "}
                            {result.summary.detected_rejects} afkeur gevonden
                          </small>
                        </div>
                        <div>
                          <span>Gebruikte werktijd</span>
                          <strong>
                            {number(result.summary.working_minutes / 60)}
                            <i> uur</i>
                          </strong>
                          <small>
                            {number(result.summary.cutting_minutes)} min
                            effectief snijden
                          </small>
                        </div>
                        <div>
                          <span>Snijkanten</span>
                          <strong>
                            {result.summary.tools_used}
                            <i> gebruikt</i>
                          </strong>
                          <small>
                            {result.summary.tool_changes} gereedschapswissels
                          </small>
                        </div>
                      </div>
                      <div className="truth-kpis">
                        <div>
                          <span>Vrijgegeven (gemeten goed)</span>
                          <strong>{result.summary.released}</strong>
                        </div>
                        <div>
                          <span>Onbevestigd</span>
                          <strong>{result.summary.pending_release}</strong>
                        </div>
                        <div>
                          <span>Kost / vrijgegeven stuk</span>
                          <strong>
                            {result.summary.cost_per_released_eur === null
                              ? "Geen vrijgegeven stukken"
                              : euro(result.summary.cost_per_released_eur)}
                          </strong>
                        </div>
                        <p>
                          {result.summary.supplemental_produced} aanvullend
                          geproduceerd · {result.summary.final_inspections}{" "}
                          eindcontroles.{" "}
                          {result.summary.release_on_time
                            ? "Vrijgegeven orderdoel bereikt."
                            : "Nog onvoldoende vrijgegeven stukken voor de order."}{" "}
                          {result.summary.uninspected === 0
                            ? "Alle geproduceerde stukken zijn gemeten. De nabespreking onthult hier geen extra afkeur."
                            : "De nabespreking onthult de simulatiekwaliteit van de ongemeten stukken; dit verandert de vrijgave niet."}
                        </p>
                      </div>
                      <p className="hint">Dit is één illustratieve simulatie. Toets een strategie met andere seeds en gecontroleerde praktijkproeven voordat je conclusies voor je machine trekt.</p>
                      <details><summary>Kies instellingen uit een eerdere proef</summary>{sourceSelector()}</details>
                      <div className="chart-title">
                        <h3 ref={qualityHeading} tabIndex={-1}>
                          {reveal
                            ? "Werkelijk kwaliteitsverloop"
                            : "Wat je kwaliteitsmetingen laten zien"}
                        </h3>
                        <span>
                          ● goed &nbsp; <span className="orange">● afkeur</span>
                        </span>
                      </div>
                      <Plot
                        parts={result.parts}
                        limit={result.scenario_snapshot.ra_limit_um}
                        reveal={reveal}
                      />
                      <p className="hint">
                        Alleen geïnspecteerde stukken verschijnen in de
                        meetweergave. Ook diameterafwijking telt mee voor
                        goed/afkeur; de grafiek toont Ra.
                      </p>
                      <h3>Theoretisch verbruik van de snijkant</h3>
                      <p className="hint">Taylor-achtig model met illustratieve coëfficiënten. Index 1 betekent dat de berekende referentiestandtijd is verbruikt; dit is geen gemeten slijtage of breukgrens. De simulator gebruikt dezelfde index voor zijn interne slijtagetoestand.</p>
                      <Plot parts={result.parts} limit={1} reveal wear />
                      <Sampling result={result} />
                      <div className="observation">
                        <div>
                          <b>Wat weet je als deelnemer?</b>
                          <p>
                            {result.summary.inspected} stukken gemeten,{" "}
                            {result.summary.detected_rejects} afkeur
                            vastgesteld. Van {result.summary.uninspected}{" "}
                            stukken is de kwaliteit onbekend zonder extra
                            controle.
                          </p>
                          {result.settings.mode === "week" && (
                            <p>
                              <b>
                                Nominaal geaccepteerd:{" "}
                                {result.summary.nominal_accepted} /{" "}
                                {result.summary.order_target}
                              </b>{" "}
                              · inclusief {result.summary.accepted_unverified}{" "}
                              niet gecontroleerde stukken. De productie stopt
                              bij het nominale doel (steekproef) of na controle
                              en aanvulling (eindcontrole), uiterlijk aan het
                              einde van de week. Vrijgave en werkelijke
                              simulatiekwaliteit blijven afzonderlijke
                              uitkomsten.
                            </p>
                          )}
                        </div>
                        <div className="decision" ref={decisionPanel} tabIndex={-1} role="region" aria-label="Besluit over deze proef">
                          <fieldset>
                            <legend>Mijn besluit over dit resultaat</legend>
                            {[
                              "Voldoende gemeten bewijs voor mijn doel",
                              "Nog onvoldoende gemeten bewijs voor mijn doel",
                              "Ik twijfel nog",
                            ].map((choice) => (
                              <label className="check" key={choice}>
                                <input
                                  type="radio"
                                  name="decision"
                                  checked={decision === choice}
                                  onChange={() => {
                                    setDecision(choice);
                                    setDecisionSaved(false);
                                  }}
                                />
                                <span>{choice}</span>
                              </label>
                            ))}
                          </fieldset>
                          <button
                            disabled={!decision}
                            onClick={() => {
                              if (run)
                                setSession((s) => ({
                                  ...s,
                                  runs: s.runs.map((r) =>
                                    r.id === run.id
                                      ? recordDecision(r, decision)
                                      : r,
                                  ),
                                }));
                              setDecisionSaved(true);
                            }}
                          >
                            Besluit vastleggen
                          </button>
                          {decisionSaved && (
                            <p role="status">
                              <b>Besluit opgeslagen.</b>
                            </p>
                          )}
                          {run?.decisions?.map((d, i) => (
                            <p key={i}>
                              {d.value} ·{" "}
                              {d.afterReveal
                                ? "na onthulling/export"
                                : "vóór onthulling"}{" "}
                              · {new Date(d.at).toLocaleString("nl-BE")}
                            </p>
                          ))}
                          <button
                            disabled={
                              !run?.decisions?.length && !run?.revealedAt
                            }
                            onClick={revealQuality}
                          >
                            Toon werkelijke simulatiekwaliteit
                          </button>
                          {!run?.decisions?.length && !run?.revealedAt && (
                            <small>
                              Leg eerst je besluit vast om de werkelijke
                              simulatiekwaliteit te tonen.
                            </small>
                          )}
                          <small>Nabespreking: bekijk verborgen simulatiekwaliteit. Dit is geen vergelijking en verandert inspectie en vrijgave niet.</small>
                          <button
                            onClick={() => {
                              setTab("compare");
                              requestAnimationFrame(() =>
                                document
                                  .querySelector(".comparison")
                                  ?.scrollIntoView({ block: "start" }),
                              );
                            }}
                          >
                            Vergelijk proeven
                          </button>
                          <details>
                            <summary>
                              Begeleider: direct naar nabespreking
                            </summary>
                            <button onClick={revealQuality}>
                              Open nabespreking zonder besluit
                            </button>
                          </details>
                        </div>
                      </div>
                      {reveal && (
                        <div className="truth-kpis">
                          <div>
                            <span>Werkelijk goed</span>
                            <strong>{result.summary.good}</strong>
                          </div>
                          <div>
                            <span>Werkelijke afkeur</span>
                            <strong>{result.summary.rejected}</strong>
                          </div>
                          <div>
                            <span>Kost per goed stuk</span>
                            <strong>
                              {euro(result.summary.cost_per_good_eur)}
                            </strong>
                          </div>
                          <p>
                            {result.settings.mode === "week" && (
                              <b>
                                {result.summary.on_time
                                  ? "Werkelijk orderdoel op tijd gehaald. "
                                  : "Werkelijk onvoldoende goede stukken voor levering. "}
                              </b>
                            )}
                            Vrijgegeven: {result.summary.released}/
                            {result.summary.order_target}; onbevestigd:{" "}
                            {result.summary.pending_release}. Deze grondwaarheid
                            is alleen in de simulator bekend en verandert
                            inspectie en vrijgave niet. Op je machine moet je
                            dit met een passend meetplan toetsen.
                          </p>

                        </div>
                      )}
                      <details>
                        <summary>
                          Tijdrekening & recept
                        </summary>
                        <div className="detail-columns">
                          <div>
                            <h3>Tijdrekening</h3>
                            <p>
                              Werktijd:{" "}
                              {number(result.summary.working_minutes / 60)} van{" "}
                              {number(result.summary.available_minutes / 60)}{" "}
                              beschikbare uren ·{" "}
                              {number(result.summary.unused_minutes / 60)} uur
                              rooster over
                            </p>
                            {Object.entries(
                              result.summary.downtime_minutes,
                            ).map(([key, value]) => (
                              <div className="data-row" key={key}>
                                <span>
                                  {{
                                    handling: "Laden / lossen",
                                    inspection: "Kwaliteitscontrole",
                                    tool_change: "Snijkant wisselen",
                                    shift_wait: "Buiten de dienst",
                                  }[key] ?? key}
                                </span>
                                <b>{number(value)} min</b>
                              </div>
                            ))}
                            <div className="data-row">
                              <span>
                                Kalenderdoorloop (inclusief nachten / buiten
                                dienst)
                              </span>
                              <b>
                                {number(result.summary.elapsed_minutes)} min
                              </b>
                            </div>
                            <div className="data-row">
                              <span>Onbenutte roostertijd</span>
                              <b>{number(result.summary.unused_minutes)} min</b>
                            </div>
                            {result.summary.unfinished_operation && (
                              <p className="warning-text">
                                Week geëindigd tijdens:{" "}
                                {{
                                  handling: "laden/lossen",
                                  cutting: "bewerken",
                                  inspection: "inspectie",
                                  tool_change: "gereedschapswissel",
                                }[result.summary.unfinished_operation] ??
                                  result.summary.unfinished_operation}
                                . Verbruikte tijd en materiaal zijn in de kosten
                                opgenomen.
                              </p>
                            )}
                          </div>
                          <div>
                            <h3>Vast bewerkingsrecept</h3>
                            <p>
                              {result.process.passes} gangen ·{" "}
                              {number(result.process.removed_volume_cm3, 2)} cm³
                              materiaalafname
                            </p>
                            <p>
                              Snijtijd per stuk:{" "}
                              {number(result.process.cutting_minutes, 2)} min
                              <br />
                              Referentiecyclus:{" "}
                              {number(result.process.cycle_minutes, 2)} min
                              <br />
                              Toerental per gang:{" "}
                              {result.process.rpm_by_pass
                                .map((n) => number(n, 0))
                                .join(" / ")}{" "}
                              omw/min
                              <br />
                              Illustratieve standtijd:{" "}
                              {number(result.process.tool_life_minutes, 1)}{" "}
                              snijminuten
                            </p>
                          </div>
                        </div>
                        <h3>Kostenopbouw</h3>
                        {Object.entries(
                          result.summary.cost_breakdown_eur ?? {},
                        ).map(([key, value]) => (
                          <div className="data-row" key={key}>
                            <span>
                              {{
                                machine: "Machinegebruik",
                                material: "Materiaal",
                                tools: "Snijkanten",
                              }[key] ?? key}
                            </span>
                            <b>{euro(value)}</b>
                          </div>
                        ))}
                      </details>
                      <details>
                        <summary>Meetwaarden per stuk bekijken</summary>
                        <p className="hint">
                          Laatste 50{" "}
                          {reveal ? "geproduceerde" : "geïnspecteerde"} stukken.
                          CSV bevat alle simulatiegegevens, inclusief werkelijke
                          kwaliteit.
                        </p>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Stuk</th>
                                <th>Ra (µm)</th>
                                <th>Diameter (mm)</th>
                                <th>Snijkant</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.parts
                                .filter((p) => reveal || p.inspected)
                                .slice(-50)
                                .map((p) => (
                                  <tr key={p.number}>
                                    <td>{p.number}</td>
                                    <td>{number(p.ra_um, 3)}</td>
                                    <td>{number(p.diameter_mm, 4)}</td>
                                    <td>{p.tool_number}</td>
                                    <td>
                                      {p.good ? "Goed" : "Afkeur"}
                                      {!p.inspected
                                        ? " (niet gemeten)"
                                        : " (gemeten)"}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                      {!run?.revealedAt && (
                        <p className="hint">
                          CSV en samenvatting bevatten werkelijke kwaliteit.
                          Toon eerst de nabespreking om deze te exporteren. Een
                          workshopbestand blijft altijd beschikbaar via Bewaar
                          bestand.
                        </p>
                      )}
                      <div className="result-actions">
                        <button
                          onClick={() => {
                            setSession((s) => ({ ...s, baseline: run!.id }));
                            setNotice(
                              "Deze proef is de uitgangssituatie voor vergelijkingen.",
                            );
                          }}
                        >
                          Als uitgangssituatie
                        </button>
                        <button onClick={() => setTab("compare")}>
                          Vergelijk proeven →
                        </button>
                        <button
                          disabled={!run?.revealedAt}
                          onClick={() => void exportResult("csv")}
                        >
                          CSV ↓
                        </button>
                        <button
                          disabled={!run?.revealedAt}
                          onClick={() => void exportResult("summary")}
                        >
                          Samenvatting ↓
                        </button>
                      </div>
                    </section>
                    <div className="card reflection">
                      <div className="section-label">
                        05 — NEEM JE VOLGENDE BESLISSING
                      </div>
                      <label>
                        Welke waarneming ondersteunt je volgende proef?
                        <textarea
                          id="reflection-field"
                          value={run?.reflection ?? session.reflection}
                          maxLength={3000}
                          placeholder="Ik zag … Dit ondersteunt … In mijn bedrijf zou ik … controleren."
                          onChange={(e) => {
                            const value = e.target.value;
                            setSession((s) => ({
                              ...s,
                              reflection: value,
                              runs: s.runs.map((r) =>
                                r.id === run?.id
                                  ? { ...r, reflection: value }
                                  : r,
                              ),
                            }));
                          }}
                        />
                      </label>
                      <p role="status">{cacheBlocked ? "Lokale opslag is beschermd; exporteer je oefening." : saveStatus}</p>
                      <p>Eerdere proeven blijven in deze oefening bewaard. Je hoeft niet te resetten of een bestand te openen.</p>
                      <button className="primary" onClick={editConcept}>Proef instellingen</button>
                      <button onClick={() => setTab("compare")}>Vergelijk proeven</button>
                    </div>
                  </>
                ) : (
                  <div className="card empty">
                    <span>↗</span>
                    <h2>{busy ? "Berekening bezig…" : "Bereid je proef voor"}</h2>
                    <p>
                      Kies instellingen en noteer eventueel je verwachting. Het resultaat verschijnt na het simuleren. Vorige proeven blijven apart bewaard.
                    </p>
                    <button onClick={() => setTab("guide")}>
                      Bekijk de opdrachten →
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </>
        )}
        {tab === "compare" && (
          <section className="card comparison">
            <div className="section-label">VAN METING NAAR BESLISSING</div>
            <h2>Welke strategie werkt voor jouw opdracht?</h2>
            <p>
              Kies een uitgangssituatie en vergelijk tijd, kwaliteit en kost. De
              gemeten kwaliteit is direct beschikbaar. Werkelijke simulatiekwaliteit verschijnt alleen voor proeven die je al hebt onthuld.
            </p>
            {!session.runs.length ? (
              <div className="empty">
                <h3>Nog geen proeven om te vergelijken.</h3>
                <button className="primary" onClick={() => setTab("atelier")}>
                  Voer je eerste proef uit →
                </button>
              </div>
            ) : (
              <>
                {sourceSelector()}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Proef</th>
                        <th>Instellingen</th>
                        <th>Meetbewijs</th><th>Vrijgegeven / bruto</th>
                        <th>Kost / vrijgegeven</th>
                        <th>Vrijgave levering</th>
                        <th>Werkelijk goed / bruto</th>
                        <th>Kost / goed</th>
                        <th>Werktijd</th>
                        <th>Snijkanten</th>
                        <th>Werkelijke levering</th>
                        <th>Vergelijkingsreferentie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.runs.map((r) => (
                        <tr
                          key={r.id}
                          className={
                            r.id === session.baseline ? "baseline" : ""
                          }
                        >
                          <th>
                            <button
                              className="text-button"
                              onClick={() => {
                                setActive(r.id);
                                setView("result");
                                setFocusResult(true);
                                setReveal(false);
                                setTab("atelier");
                              }}
                            >
                              Bekijk resultaat: {r.name}
                            </button>
                            <small>
                              {r.result.settings.mode === "week"
                                ? "Weekorder"
                                : "Proefreeks"}{" "}
                              · {r.result.scenario_snapshot.title}
                            </small>
                          </th>
                          <td data-label="Instellingen">
                            {r.result.settings.speed_m_min} m/min
                            <br />
                            {number(r.result.settings.feed_mm_rev, 2)} mm/omw
                            <br />
                            <small>
                              Wisselen na {r.result.settings.change_after_parts}{" "}
                              stuks · inspectie elke{" "}
                              {r.result.settings.inspect_every} stuks ·
                              verschuiving {r.result.settings.inspection_offset}{" "}
                              stuks
                              <br />
                              {r.result.settings.release_policy === "final"
                                ? "Eindcontrole + aanvulling"
                                : "Steekproef"}
                            </small>
                          </td>
                          <td data-label="Meetbewijs">{measurementEvidence(r.result.summary).good}/{r.result.summary.inspected} gemeten goed<br/>{r.result.summary.detected_rejects} gemeten afkeur<br/>{r.result.summary.uninspected} ongemeten</td>
                          <td data-label="Vrijgegeven / bruto">
                            {r.result.summary.released} /{" "}
                            {r.result.summary.produced}
                            {r.result.settings.release_policy === "sample" && <small>{samplingExplanation(r.result)}</small>}
                          </td>
                          <td data-label="Kost / vrijgegeven">
                            {r.result.summary.cost_per_released_eur === null
                              ? "Geen vrijgegeven stukken"
                              : euro(r.result.summary.cost_per_released_eur)}
                          </td>
                          <td data-label="Vrijgave levering">
                            {r.result.settings.mode === "week"
                              ? r.result.summary.release_on_time
                                ? "Op tijd vrijgegeven"
                                : "Onvoldoende vrijgegeven"
                              : "—"}
                          </td>
                          <td data-label="Werkelijk goed / bruto">
                            {r.revealedAt
                              ? `${r.result.summary.good} / ${r.result.summary.produced}`
                              : "Na besluit en onthulling"}
                          </td>
                          <td data-label="Kost / goed">
                            {r.revealedAt
                              ? euro(r.result.summary.cost_per_good_eur)
                              : "Na onthulling"}
                          </td>
                          <td data-label="Werktijd">
                            {number(r.result.summary.working_minutes)} min
                          </td>
                          <td data-label="Snijkanten">
                            {r.result.summary.tools_used}
                          </td>
                          <td data-label="Werkelijke levering">
                            {r.result.settings.mode === "week"
                              ? !r.revealedAt
                                ? "Na onthulling"
                                : r.result.summary.on_time
                                  ? "Op tijd"
                                  : "Niet gehaald"
                              : "—"}
                          </td>
                          <td data-label="Vergelijkingsreferentie">
                            <label className="radio">
                              <input
                                type="radio"
                                name="baseline"
                                aria-label={`${r.name} als vergelijkingsreferentie`}
                                checked={r.id === session.baseline}
                                onChange={() =>
                                  setSession((s) => ({ ...s, baseline: r.id }))
                                }
                              />
                              {r.id === session.baseline ? "Referentie" : ""}
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="compare-detail">
                  <label>
                    Vergelijk met
                    <select
                      value={run?.id ?? ""}
                      onChange={(e) => setActive(e.target.value)}
                    >
                      {session.runs.map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {baseline && result && (
                    <div>
                      {compatible ? (
                        <>
                          <p>
                            <b>{run?.name}</b> tegenover <b>{baseline.name}</b>:{" "}
                            {number(
                              result.summary.released -
                                baseline.result.summary.released,
                              0,
                            )}{" "}
                            vrijgegeven stukken verschil,{" "}
                            {euro(
                              result.summary.total_cost_eur -
                                baseline.result.summary.total_cost_eur,
                            )}{" "}
                            totale kost verschil.
                          </p>
                          <p className="hint">
                            Controleer ook ordergrootte, seed en kwaliteitsgrens
                            voordat je conclusies trekt. Een enkele run bewijst
                            geen algemene verbetering.
                          </p>
                          <button onClick={exportDelta}>
                            Verschillen voor ROI-verkenning ↓
                          </button>
                        </>
                      ) : (
                        <p className="warning-text">
                          Vergelijk voor een bruikbare conclusie dezelfde case,
                          ordergrootte, modelversie en hetzelfde type oefening.
                          Deze selectie verschilt daarvan.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <details>
                  <summary>
                    Verwachtingen en conclusies teruglezen (leesweergave)
                  </summary>
                  {session.runs.map((r) => (
                    <article className="run-notes" key={r.id}>
                      <h3>{r.name}</h3>
                      <button
                        onClick={() => {
                          setActive(r.id);
                          setView("result");
                          setTab("atelier");
                          requestAnimationFrame(() => {
                            document
                              .getElementById("reflection-field")
                              ?.scrollIntoView();
                            document
                              .getElementById("reflection-field")
                              ?.focus();
                          });
                        }}
                      >
                        Conclusie bewerken: {r.name}
                      </button>
                      <p>
                        <b>Verwachting:</b> {r.prediction || "Niet ingevuld."}
                      </p>
                      <p>
                        <b>Conclusie:</b> {r.reflection || "Nog niet ingevuld."}
                      </p>
                    </article>
                  ))}
                </details>
              </>
            )}
            <p className="hint">
              Je oefening bewaart maximaal 12 proeven. Bij een volle reeks
              blijven alle proeven behouden. Bewaar een workshopbestand en reset
              daarna om een nieuwe reeks te starten.
            </p>
          </section>
        )}
        {tab === "guide" && (
          <section className="guide">
            <div className="card">
              <div className="section-label">VOORMIDDAG · OEFENING 1</div>
              <h2>Maak een goed stuk tegen een goede kost.</h2>
              <p>
                Je maakt een cilindrische as. De diameter en het oppervlak
                moeten binnen de opdrachtgrenzen blijven.
              </p>
              <ol>
                <li>
                  Start met de standaardcase en 10 proefstukken. Noteer je
                  verwachting en voer de uitgangssituatie uit.
                </li>
                <li>
                  Kies één wijziging: bijvoorbeeld voeding van 0,18 naar 0,24
                  mm/omw. Houd de overige instellingen en seed gelijk.
                </li>
                <li>
                  Vergelijk bewegingstijd, gemeten kwaliteit en kost per
                  werkelijk goed stuk.
                </li>
                <li>
                  Verklaar het verschil met de procesrelatie. Probeer vervolgens
                  een andere snijsnelheid.
                </li>
                <li>
                  Herhaal met twee andere seeds en de case met strengere
                  afwerking.
                </li>
              </ol>
              <button
                className="primary"
                onClick={() => {
                  mode("trial");
                  setTab("atelier");
                }}
              >
                Start oefening 1 →
              </button>
            </div>
            <div className="card">
              <div className="section-label">NAMIDDAG · OEFENING 2</div>
              <h2>Lever een productieorder.</h2>
              <p>
                Lever 800 goede assen binnen vijf diensten. Kies
                procesinstellingen, wisselbeleid en een meetplan.
              </p>
              <ol>
                <li>
                  Schakel naar Productieweek en voer eerst een uitgangssituatie
                  uit.
                </li>
                <li>
                  Vergelijk vroeg en laat wisselen: bijvoorbeeld na 8, 40 en 80
                  stukken. Bekijk slijtage, kosten en afkeur. Dezelfde
                  intervallen zijn bij strengere eisen niet noodzakelijk
                  passend.
                </li>
                <li>
                  Vergelijk meten per stuk met meten per 20 stukken. Welke
                  kwaliteit ken je werkelijk?
                </li>
                <li>
                  Vergelijk meetverschuiving 0 met een halve meetperiode. Bekijk
                  welke snijkantleeftijden werkelijk zijn gemeten. Houd
                  meetbudget en overige keuzes gelijk. Concreet: proefreeks 800,
                  wissel 80, meetperiode 40; vergelijk verschuiving 0 en 10. Het
                  aantal metingen blijft gelijk, de bemonsterde leeftijden
                  verschillen.
                </li>
                <li>
                  Kies eindcontrole en aanvullende productie. Hoeveel extra tijd
                  en stukken kosten bewezen leverbare kwaliteit?
                </li>
                <li>
                  Activeer wisselen na gemeten afkeur. Alleen nu stuurt die
                  informatie het proces bij.
                </li>
                <li>
                  Onderzoek een voorzichtige strategie en een onhaalbaar
                  orderdoel van 5.000 stuks. Wat verhindert tijdige levering?
                </li>
              </ol>
              <button
                className="primary"
                onClick={() => {
                  mode("week");
                  setTab("atelier");
                }}
              >
                Start oefening 2 →
              </button>
            </div>
            <div className="card full-width">
              <div className="section-label">
                NEEM HET MEE NAAR JE EIGEN MACHINE
              </div>
              <h2>Sluit elke oefening af met vier vragen.</h2>
              <div className="questions">
                <p>
                  <span>01</span>Wat heb je geleerd?
                </p>
                <p>
                  <span>02</span>Welke waarneming ondersteunt dat?
                </p>
                <p>
                  <span>03</span>Welke informatie ontbreekt?
                </p>
                <p>
                  <span>04</span>Welke gecontroleerde proef zou je in je bedrijf
                  uitvoeren?
                </p>
              </div>
              <details>
                <summary>Hoe rekent de simulator?</summary>
                <p>
                  Het vaste recept gebruikt meerdere langsdraaigangen. Toerental
                  volgt uit snijsnelheid en diameter; bewegingstijd volgt uit
                  lengte, toerental en voeding. Een geometrische ruwheidsrelatie
                  beschrijft het voedingsspoor.
                </p>
                <p>
                  Standtijd, slijtagebijdrage, maatdrift, spreiding, tijden en
                  kosten zijn illustratieve scenarioparameters. Ze zijn niet met
                  industriële metingen gevalideerd. Ze maken een afweging
                  zichtbaar, maar voorspellen geen specifieke machine.
                </p>
                <p>
                  Een snijkant slijt op basis van echte snijminuten en behoudt
                  zijn resterende levensduur over stukken heen. Een wissel reset
                  de snijkant. Inspectie kost tijd; logging alleen verandert
                  geen productietoestand.
                </p>
                <p>
                  Bij steekproeven stopt de productie zodra het nominale aantal
                  (geproduceerd min gemeten afkeur) het orderdoel bereikt;
                  onbekende kwaliteit telt daarbij voorlopig als geaccepteerd.
                  Werkelijke goede output bepaalt bij de nabespreking of
                  levering echt haalbaar was. Bij eindcontrole worden alle
                  onbekende stukken gecontroleerd; ontbrekende vrijgegeven
                  stukken worden binnen het rooster aangevuld. Reeds gemeten
                  stukken kosten geen tweede inspectie. Afkeur houdt het
                  betreffende stuk tegen; de optionele reactie wisselt de
                  snijkant vóór de volgende snede. Er is geen batchquarantaine.
                  De werkweek telt alleen ingeroosterde tijd. Operaties pauzeren
                  aan het einde van een dienst en lopen de volgende dienst
                  verder. Aan het einde van de week telt een onafgewerkt stuk
                  niet als geproduceerd; verbruikte tijd en materiaal blijven
                  kosten.
                </p>
                <p>
                  Kosten omvatten machinegebruik, materiaal en snijkanten.
                  Vrijgekomen capaciteit wordt niet nogmaals als
                  arbeidsbesparing opgevoerd. Bij nul goede stukken bestaat geen
                  eindige kost per goed stuk.
                </p>
              </details>
              <details>
                <summary>Begeleidersnotities & onderzoeksgrenzen</summary>
                <p>
                  Laat deelnemers vooraf een voorspelling opschrijven en één
                  factor tegelijk wijzigen. Toon werkelijke simulatiekwaliteit
                  pas bij de nabespreking. Bespreek waarom een steekproef geen
                  bewijs is dat alle stukken goed zijn.
                </p>
                <p>
                  Laat een groep uitsluitend cyclustijd optimaliseren en een
                  andere groep leverbare kwaliteit. Wissel daarna de resultaten
                  uit. Vergelijk meetfrequenties zowel zonder als met de
                  expliciete wisselregel.
                </p>
                <p>
                  Vraag bij elk schijnbaar optimum welke context dit kan
                  veranderen: materiaalpartij, inzetkwaliteit, machinegrens,
                  meetonzekerheid of ordergrootte. Synthetische data die het
                  eigen model volgen, valideren dat model niet empirisch.
                </p>
                <p>
                  Voor toepassing in een bedrijf zijn een veilige parameterkeuze
                  door de procesverantwoordelijke, een gekalibreerde meetketen
                  en gecontroleerde herhaalproeven nodig. De simulator
                  communiceert niet met PLC, HMI of machine.
                </p>
              </details>
            </div>
          </section>
        )}
        <footer>
          <span>
            COOCK+ · Verspaningsatelier{" "}
            <small>
              Illustratieve leeromgeving · model{" "}
              {result?.model_version ?? "2.0.0"}
            </small>
          </span>
          <div>
            {reset ? (
              <>
                <span>Eigen oefening wissen?</span>
                <button
                  onClick={() => {
                    const clean: Session = {
                      format: "coock-workshop-v2",
                      settings: DEFAULT,
                      runs: [],
                      baseline: null,
                      prediction: "",
                      reflection: "",
                    };
                    setSession(clean);
                    setView("concept");
                    setSourceId(null);
                    setReveal(false);
                    setDecision("");
                    setDecisionSaved(false);
                    setPrepared(null);
                    setCacheBlocked(false);
                    setError("");
                    setActive(null);
                    setReset(false);
                    setNotice(
                      "Je oefening is opnieuw gestart. Gedownloade bestanden blijven behouden.",
                    );
                  }}
                >
                  Ja, wis oefening
                </button>
                <button onClick={() => setReset(false)}>Annuleren</button>
              </>
            ) : (
              <button onClick={() => setReset(true)}>
                Eigen oefening resetten
              </button>
            )}
          </div>
        </footer>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
