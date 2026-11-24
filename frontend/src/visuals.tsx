import { useEffect, useState, useMemo } from "react";
import type { Result } from "./types";
const labels: Record<string, string> = {
  handling: "Laden / lossen",
  cutting: "Snijden",
  inspection: "Inspecteren",
  final_inspection: "Eindcontrole",
  tool_change: "Snijkant wisselen",
  shift_wait: "Wachten buiten de dienst",
};
export function Machine({
  result,
  speed,
  onSpeedChange,
}: {
  result: Result | null;
  speed: number;
  onSpeedChange: (speed: number) => void;
}) {
  const events = result?.playback_events ?? [];
  const eventLabel = (e: (typeof events)[number]) =>
    e.kind === "inspection" &&
    e.part_number &&
    result?.parts[e.part_number - 1]?.inspection_kind === "final"
      ? "Eindcontrole"
      : (labels[e.kind] ?? e.kind);
  const choices = useMemo(
    () =>
      events.map((e, i) => (
        <option key={i} value={i}>
          {i + 1}. {eventLabel(e)} · stuk {e.part_number ?? "—"} · t=
          {e.start_minutes.toFixed(1)} min
        </option>
      )),
    [events],
  );
  const [position, setPosition] = useState(0);
  useEffect(() => setPosition(0), [result]);
  useEffect(() => {
    if (!speed || !events.length) return;
    let last = performance.now(),
      frame: number;
    const tick = (now: number) => {
      setPosition((p) => (p + ((now - last) * speed) / 1800) % events.length);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed, events]);
  const index = Math.min(Math.floor(position), Math.max(0, events.length - 1)),
    event = events[index];
  const fraction = position - Math.floor(position),
    x = event?.kind === "cutting" ? 480 - 300 * fraction : 480;
  return (
    <div className="machine">
      <div className="machine-title">
        VIRTUELE DRAAIBANK ·{" "}
        {event ? eventLabel(event) : "Voer eerst een proef uit"}
      </div>
      <svg
        viewBox="0 0 680 215"
        role="img"
        aria-label="Bewerking volgens gesimuleerde productiegebeurtenissen"
      >
        <rect x="45" y="45" width="100" height="110" rx="5" fill="#35594e" />
        <rect x="145" y="78" width="355" height="60" fill="#bccdc3" />
        <path d="M150 88H490M150 108H490M150 128H490" stroke="#e5ede8" />
        <rect x="550" y="65" width="45" height="90" fill="#35594e" />
        <path d="M500 108h50" stroke="#35594e" strokeWidth="6" />
        <g transform={`translate(${x},0)`}>
          <path
            d="M0 180v-40l-10-8 12-10 15 20 10 38Z"
            fill={event?.kind === "tool_change" ? "#eec560" : "#e78147"}
          />
        </g>
        <text x="340" y="205" textAnchor="middle" fill="#d9e9df">
          {event
            ? `${eventLabel(event)} · stuk ${event.part_number ?? "—"} · ${event.duration_minutes.toFixed(2)} min`
            : "Conceptuele machineweergave"}
        </text>
      </svg>
      {event && (
        <>
          <div className="playback" role="group" aria-label="Animatiebediening">
            {[0, 1, 4, 12].map(value => <button key={value} aria-pressed={speed === value} onClick={() => onSpeedChange(value)}>{value === 0 ? "Pauze" : `${value}× afspelen`}</button>)}
          </div>
          <label>Positie in de animatie
            <input type="range" min={0} max={Math.max(0, events.length - 0.001)} step={0.001} value={position} onChange={e => { onSpeedChange(0); setPosition(Number(e.target.value)); }} />
          </label>
          <label>
            Productiegebeurtenis
            <select
              value={index}
              onChange={(e) => { onSpeedChange(0); setPosition(Number(e.target.value)); }}
            >
              {choices}
            </select>
          </label>
          <p>
            Stap {index + 1}/{events.length}. Iedere gebeurtenis krijgt dezelfde
            kijktijd; de weergegeven productieduur komt uit de rekenkern. Kies
            Pauze om een stap vast te houden.
          </p>
        </>
      )}
    </div>
  );
}
export function Surface({ result }: { result: Result | null }) {
  const p = result?.process.profile;
  if (!p)
    return (
      <div className="surface">
        Voer een proef uit om het geometrische voedingsprofiel te bekijken.
      </div>
    );
  const h = 25;
  const path = p.points
    .map(
      (q, i) =>
        `${i ? "L" : "M"}${45 + (q.x_mm / p.width_mm) * 520},${110 - (q.y_um / h) * 80}`,
    )
    .join(" ");
  return (
    <div className="surface profile-v2">
      <b>Ideaal voedingsprofiel · uitvergroot</b>
      <svg
        viewBox="0 0 610 155"
        role="img"
        aria-label="Geometrisch oppervlakteprofiel met afstand in mm en profielhoogte in micrometer"
      >
        <path d="M45 25V110H565" stroke="#a0b5a7" fill="none" />
        <path d={path} stroke="#216453" strokeWidth="2" fill="none" />
        <text x="5" y="20">
          µm
        </text>
        <text x="5" y="40">
          {h.toFixed(2)}
        </text>
        <text x="25" y="114">
          0
        </text>
        <text x="45" y="135">
          0
        </text>
        <text x="490" y="135">
          {p.width_mm.toFixed(2)} mm
        </text>
      </svg>
      <p>
        Voedingsafstand {p.feed_mm_rev.toFixed(2)} mm/omw · piek-dalhoogte{" "}
        {p.height_um.toFixed(2)} µm. Vaste verticale schaal 0–25 µm; vergelijk
        hoogte en afstand. Theoretische Ra: {result?.process.theoretical_ra_um.toFixed(2)} µm. Ra is de gemiddelde absolute profielafwijking en verschilt van de piek-dalhoogte. Ideale geometrie uit de rekenkern; slijtage en
        spreiding zie je afzonderlijk in de kwaliteitsgrafiek.
      </p>
    </div>
  );
}
export function Sampling({ result }: { result: Result }) {
  const groups = new Map<number, { periodic: number; final: number }>();
  for (const p of result.parts) {
    if (!p.inspected) continue;
    const g = groups.get(p.age_on_edge) ?? { periodic: 0, final: 0 };
    if (p.inspection_kind === "final") g.final++;
    else g.periodic++;
    groups.set(p.age_on_edge, g);
  }
  return (
    <details>
      <summary>Welke snijkantleeftijden zijn gemeten?</summary>
      <p>
        Meetverschuiving {result.settings.inspection_offset} stuks, periode{" "}
        {result.settings.inspect_every} stuks. Leeftijd = aantal voltooide
        stukken sinds de snijkantwissel. Vergelijk verschuivingen bij gelijk
        meetbudget; eindcontrole is afzonderlijk herkenbaar.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Leeftijd (stukken)</th>
              <th>Steekproef</th>
              <th>Eindcontrole</th>
            </tr>
          </thead>
          <tbody>
            {[...groups]
              .sort((a, b) => a[0] - b[0])
              .map(([age, g]) => (
                <tr key={age}>
                  <td>{age}</td>
                  <td>{g.periodic}</td>
                  <td>{g.final}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
