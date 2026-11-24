export function reuseSettings(settings, purpose = "same") {
  return {
    ...settings,
    ...(purpose === "week" ? { mode: "week", quantity: 800 } : {}),
    ...(purpose === "final" ? { release_policy: "final" } : {}),
  };
}

export function recordDecision(run, value, at = new Date().toISOString()) {
  return {
    ...run,
    decisions: [
      ...(run.decisions ?? []),
      { value, at, afterReveal: Boolean(run.revealedAt) },
    ],
  };
}

export function orderStatus(summary) {
  if (summary.release_on_time) return "Order op tijd volledig vrijgegeven";
  return summary.unused_minutes > 1e-6
    ? "Order nog niet volledig vrijgegeven: onvoldoende gemeten goede stukken"
    : "Order niet volledig vrijgegeven binnen het rooster: onvoldoende gemeten goede stukken";
}

// Optional metadata keeps sessions from before the UX update readable.
export function validDecisionHistory(run) {
  const revealed =
    run.revealedAt === undefined ? null : Date.parse(run.revealedAt);
  if (
    run.revealedAt !== undefined &&
    (typeof run.revealedAt !== "string" || !Number.isFinite(revealed))
  )
    return false;
  if (run.decisions === undefined) return true;
  if (!Array.isArray(run.decisions)) return false;
  let previous = -Infinity;
  return run.decisions.every((d) => {
    if (
      !d ||
      typeof d.value !== "string" ||
      !d.value.trim() ||
      d.value.length > 1000 ||
      typeof d.at !== "string" ||
      typeof d.afterReveal !== "boolean"
    )
      return false;
    const time = Date.parse(d.at);
    if (
      !Number.isFinite(time) ||
      time < previous ||
      (d.afterReveal && (revealed === null || time < revealed)) ||
      (!d.afterReveal && revealed !== null && time > revealed)
    )
      return false;
    previous = time;
    return true;
  });
}

export function discloseRuns(runs, at = new Date().toISOString()) {
  return runs.map((run) => ({ ...run, revealedAt: run.revealedAt ?? at }));
}
const SETTING_LABELS = {
  scenario_id: 'voorbeeldcase', mode: 'oefening', quantity: 'aantal stuks',
  speed_m_min: 'snijsnelheid', feed_mm_rev: 'voeding', change_after_parts: 'wisselinterval',
  inspect_every: 'meetinterval', inspection_offset: 'meetverschuiving', seed: 'seed',
  release_policy: 'vrijgavebeleid', logging: 'logging', stop_on_reject: 'wisselen na afkeur',
};
function settingValue(key, value) {
  if (key === 'release_policy') return value === 'final' ? 'eindcontrole en aanvulling' : 'steekproef';
  if (key === 'mode') return value === 'week' ? 'productieweek' : 'proefreeks';
  if (typeof value === 'boolean') return value ? 'aan' : 'uit';
  if (key === 'scenario_id') return String(value).replace('steel-shaft-finish', 'C45 fijne afwerking').replace('steel-shaft', 'C45 afstandsas');
  if (typeof value === 'number' && !Number.isFinite(value)) return 'nog invullen';
  return typeof value === 'number' ? value.toLocaleString('nl-BE') : String(value);
}
export function settingChanges(source, draft) {
  return Object.keys(SETTING_LABELS).filter(key => !Object.is(source[key], draft[key]))
    .map(key => `${SETTING_LABELS[key]}: ${settingValue(key, source[key])} → ${settingValue(key, draft[key])}`);
}
export function changeGroups(source, draft) {
  const changed = Object.keys(SETTING_LABELS).filter(key => !Object.is(source[key], draft[key]));
  const taskKeys = ['scenario_id', 'mode', 'quantity'];
  const describe = keys => keys.map(key => `${SETTING_LABELS[key]}: ${settingValue(key, source[key])} → ${settingValue(key, draft[key])}`);
  return { task: describe(changed.filter(key => taskKeys.includes(key))),
    process: describe(changed.filter(key => !taskKeys.includes(key))) };
}
export function trialTitle(index, name) {
  const label = `Proef ${index + 1}`;
  return !name || name.trim().toLocaleLowerCase('nl-BE') === label.toLocaleLowerCase('nl-BE')
    ? label : `${label} · ${name}`;
}
export function initialView(draft, executed) {
  return executed && settingChanges(executed, draft).length === 0 ? 'result' : 'concept';
}
export function measurementEvidence(summary) {
  return { good: summary.inspected - summary.detected_rejects,
    measured: summary.inspected, rejects: summary.detected_rejects, unknown: summary.uninspected };
}
// Commit only successful calculations. Rejection leaves the caller's draft and runs untouched.
export async function calculateTrial(settings, calculate) {
  return calculate({ ...settings });
}
