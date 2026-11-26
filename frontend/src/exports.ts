import type { Part, Result } from "./types.ts";

const columns = [
  "number",
  "time_minutes",
  "ra_um",
  "diameter_mm",
  "wear",
  "good",
  "inspected",
  "observed_good",
  "tool_number",
  "age_on_edge",
  "inspection_kind",
  "observed_time_minutes",
] as const satisfies readonly (keyof Part)[];

export function csv(result: Result): string {
  const rows = result.parts.map((part) =>
    columns
      .map((key) => {
        const value = part[key];
        if (typeof value === "boolean") return value ? "True" : "False";
        return value ?? "";
      })
      .join(";"),
  );
  return "\ufeff" + [columns.join(";"), ...rows, ""].join("\r\n");
}

export function markdown(result: Result): string {
  const { summary: s, settings } = result;
  const yesNo = (value: boolean) => (value ? "ja" : "nee");
  const euro = (value: number | null) =>
    value === null ? "niet gedefinieerd" : `€ ${value.toFixed(2)}`;
  return [
    "# COOCK — proefsamenvatting",
    "",
    `Scenario ${settings.scenario_id} · model ${result.model_version} · seed ${settings.seed}`,
    `Instellingen · ${settings.speed_m_min} m/min · ${settings.feed_mm_rev} mm/omw · wissel om ${settings.change_after_parts} stukken · inspectie om ${settings.inspect_every} stukken`,
    `Modus ${settings.mode} · doel ${settings.quantity} · wissel na gemeten afkeur ${yesNo(settings.stop_on_reject)}`,
    `Vrijgavebeleid ${settings.release_policy} · inspectieverschuiving ${settings.inspection_offset} stukken`,
    "",
    `Geproduceerd ${s.produced} · werkelijk goed ${s.good} · werkelijk afgekeurd ${s.rejected}`,
    `Geïnspecteerd ${s.inspected} · gemeten afkeur ${s.detected_rejects} · ongeïnspecteerd ${s.uninspected}`,
    `Snijkanten ${s.tools_used} · wissels ${s.tool_changes} · totale kost ${euro(s.total_cost_eur)} · kost per goed stuk ${euro(s.cost_per_good_eur)}`,
    `Snijtijd ${s.cutting_minutes.toFixed(3)} min · roostertijd ${s.working_minutes.toFixed(3)} min · kalenderduur ${s.elapsed_minutes.toFixed(3)} min`,
    `Vrijgegeven ${s.released} · onbevestigd ${s.pending_release} · aanvullende productie ${s.supplemental_produced} · eindinspecties ${s.final_inspections}`,
    `Vrijgegeven order op tijd ${yesNo(s.release_on_time)} · kost per vrijgegeven stuk ${euro(s.cost_per_released_eur)}`,
    `Werkelijk goede orderhoeveelheid ${yesNo(s.on_time)} (synthetische grondwaarheid)`,
    "",
    "## Tijd per oorzaak (min)",
    ...Object.entries(s.downtime_minutes).map(
      ([kind, minutes]) => `- ${kind} · ${minutes.toFixed(3)}`,
    ),
    "",
    "Vergelijk voor ROI de snijkanten, afkeur en stilstand met een gelijke baseline. Vermijd dubbele waardering van vrijgekomen capaciteit.",
    "",
    "Leeromgeving met illustratieve slijtage- en kwaliteitsparameters. De werkelijke kwaliteit in deze oefening komt uit het simulatiemodel.",
    "",
  ].join("\n");
}
