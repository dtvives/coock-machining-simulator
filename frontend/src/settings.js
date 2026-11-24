export function validSettings(value) {
  if (
    !value ||
    !["steel-shaft", "tight-finish"].includes(value.scenario_id) ||
    !["trial", "week"].includes(value.mode) ||
    typeof value.logging !== "boolean" ||
    typeof value.stop_on_reject !== "boolean" ||
    !["sample", "final"].includes(value.release_policy) ||
    !Number.isInteger(value.inspection_offset) ||
    value.inspection_offset < 0 ||
    value.inspection_offset >= value.inspect_every
  )
    return false;
  const bounds = [
    [value.speed_m_min, 80, 300, false],
    [value.feed_mm_rev, 0.08, 0.4, false],
    [value.change_after_parts, 1, 200, true],
    [value.inspect_every, 1, 200, true],
    [value.quantity, 1, 5000, true],
    [value.seed, 0, 2147483647, true],
  ];
  return bounds.every(
    ([number, min, max, integer]) =>
      typeof number === "number" &&
      Number.isFinite(number) &&
      number >= min &&
      number <= max &&
      (!integer || Number.isInteger(number)),
  );
}

export function persistableSession(session, lastValidSettings) {
  const settings = validSettings(session.settings)
    ? session.settings
    : lastValidSettings;
  return { ...session, settings };
}
