import { partQuality, processParameters, scenarios } from "./process.ts";
import { validSettings } from "./settings.js";
import type { Part, ProductionEvent, Result, Settings } from "./types.ts";

export const MODEL_VERSION = "2.0.0-browser.1";
type Work = "handling" | "cutting" | "inspection" | "tool_change";
type Operation = Work | "shift_wait";

class Schedule {
  now = 0;
  working = 0;
  events: ProductionEvent[] = [];
  totals = {
    handling: 0,
    cutting: 0,
    inspection: 0,
    tool_change: 0,
    shift_wait: 0,
  };

  constructor(days: number, shift: number) {
    this.days = days;
    this.shift = shift;
  }

  private readonly days: number;
  private readonly shift: number;

  private record(kind: Operation, duration: number, part: number | null) {
    if (duration <= 0) return;
    this.events.push({
      kind,
      start_minutes: this.now,
      duration_minutes: duration,
      part_number: part,
    });
    this.now += duration;
    this.totals[kind] += duration;
    if (kind !== "shift_wait") this.working += duration;
  }

  consume(kind: Work, duration: number, part: number | null = null) {
    let remaining = duration;
    while (remaining > 1e-10) {
      const day = Math.floor(this.now / 1440);
      const end = day * 1440 + this.shift;
      if (this.now >= end - 1e-10) {
        if (day + 1 >= this.days) break;
        this.record("shift_wait", (day + 1) * 1440 - this.now, null);
        continue;
      }
      const used = Math.min(remaining, end - this.now);
      this.record(kind, used, part);
      remaining -= used;
    }
    return duration - remaining;
  }
}

export function simulate(input: Settings): Result {
  if (!validSettings(input))
    throw new Error("Controleer de invoer en toegestane grenzen.");
  const settings = { ...input };
  const scenario = scenarios.find(({ id }) => id === settings.scenario_id);
  if (!scenario) throw new Error("Onbekend scenario.");

  const process = processParameters(settings, scenario);
  const clock = new Schedule(scenario.days, scenario.shift_minutes);
  const available = scenario.days * scenario.shift_minutes;
  const parts: Part[] = [];
  let wear = 0;
  let edgeParts = 0;
  let toolChanges = 0;
  let loadedStock = 0;
  let detectedRejects = 0;
  let released = 0;
  let replaceAfterDetection = false;
  let unfinishedOperation: Work | null = null;
  let finalInspections = 0;
  let supplementalProduced = 0;
  let finalControlStarted = false;

  function inspect(part: Part, kind: "sample" | "final", duration: number) {
    if (part.inspected) return true;
    if (clock.consume("inspection", duration, part.number) < duration - 1e-9) {
      unfinishedOperation = "inspection";
      return false;
    }
    part.inspected = true;
    part.inspection_kind = kind;
    part.observed_time_minutes = clock.now;
    part.observed_good = part.good;
    if (kind === "final") finalInspections++;
    if (part.observed_good) {
      released++;
    } else {
      detectedRejects++;
      replaceAfterDetection ||= settings.stop_on_reject;
    }
    return true;
  }

  production: while (true) {
    const produced = parts.length;
    const accepted =
      settings.mode === "trial" ? produced : produced - detectedRejects;
    if (accepted >= settings.quantity) {
      if (settings.release_policy === "sample") break;
      finalControlStarted = true;
      for (const part of parts) {
        if (!inspect(part, "final", scenario.inspection_minutes))
          break production;
      }
      // A release decision sees completed inspections only.
      if (settings.mode === "trial" || released >= settings.quantity) break;
    }

    const number = produced + 1;
    if (edgeParts >= settings.change_after_parts || replaceAfterDetection) {
      const duration = scenario.tool_change_minutes;
      if (clock.consume("tool_change", duration) < duration - 1e-9) {
        unfinishedOperation = "tool_change";
        break;
      }
      toolChanges++;
      wear = 0;
      edgeParts = 0;
      replaceAfterDetection = false;
    }

    // Stock is committed when loading begins, even if the load cannot finish.
    if (clock.working >= available - 1e-9) break;
    loadedStock++;
    const handling = scenario.handling_minutes;
    if (clock.consume("handling", handling, number) < handling - 1e-9) {
      unfinishedOperation = "handling";
      break;
    }

    for (const pass of process.pass_details) {
      const duration = pass.cutting_minutes;
      const used = clock.consume("cutting", duration, number);
      wear += (pass.wear_increment * used) / duration;
      if (used < duration - 1e-9) {
        unfinishedOperation = "cutting";
        break production;
      }
    }

    edgeParts++;
    const part: Part = {
      number,
      time_minutes: clock.now,
      wear,
      ...partQuality(
        settings,
        scenario,
        process.theoretical_ra_um,
        number,
        wear,
      ),
      inspected: false,
      observed_good: null,
      tool_number: toolChanges + 1,
      inspection_kind: null,
      observed_time_minutes: null,
      age_on_edge: edgeParts,
    };
    parts.push(part);
    if (finalControlStarted) supplementalProduced++;
    if (
      number === 1 ||
      number % settings.inspect_every === settings.inspection_offset
    ) {
      if (!inspect(part, "sample", scenario.inspection_minutes)) break;
    }
  }

  const good = parts.filter((part) => part.good).length;
  const inspected = released + detectedRejects;
  const uninspected = parts.length - inspected;
  const toolsUsed = toolChanges + 1;
  const machine = (clock.working * scenario.machine_eur_hour) / 60;
  const material = loadedStock * scenario.material_eur_part;
  const tools = toolsUsed * scenario.edge_eur;
  const totalCost = machine + material + tools;
  const { cutting, ...downtime } = clock.totals;
  return {
    model_version: MODEL_VERSION,
    settings,
    scenario_snapshot: scenario,
    process,
    summary: {
      produced: parts.length,
      good,
      rejected: parts.length - good,
      released,
      pending_release: uninspected,
      supplemental_produced: supplementalProduced,
      final_inspections: finalInspections,
      release_on_time: released >= settings.quantity,
      cost_per_released_eur: released ? totalCost / released : null,
      inspected,
      detected_rejects: detectedRejects,
      uninspected,
      nominal_accepted: parts.length - detectedRejects,
      accepted_unverified: uninspected,
      tools_used: toolsUsed,
      tool_changes: toolChanges,
      cutting_minutes: cutting,
      elapsed_minutes: clock.now,
      working_minutes: clock.working,
      available_minutes: available,
      downtime_minutes: downtime,
      total_cost_eur: totalCost,
      cost_per_good_eur: good ? totalCost / good : null,
      cost_breakdown_eur: { machine, material, tools },
      on_time: good >= settings.quantity,
      order_target: settings.quantity,
      completion_fraction: Math.min(1, good / settings.quantity),
      final_wear: wear,
      unused_minutes: Math.max(0, available - clock.working),
      loaded_stock: loadedStock,
      unfinished_operation: unfinishedOperation,
    },
    parts,
    events: settings.logging ? clock.events : [],
    playback_events: clock.events,
  };
}
