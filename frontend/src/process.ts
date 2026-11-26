import steelShaft from "../../scenarios/steel-shaft.json" with { type: "json" };
import tightFinish from "../../scenarios/tight-finish.json" with { type: "json" };
import type { Settings } from "./types.ts";

export const scenarios = [steelShaft, tightFinish];
type Scenario = (typeof scenarios)[number];

export function processParameters(settings: Settings, scenario: Scenario) {
  const feed = settings.feed_mm_rev;
  const radius = scenario.nose_radius_mm;
  let previousDiameter = scenario.initial_diameter_mm;
  const passes = scenario.pass_diameters_mm.map((diameter) => {
    const rpm = Math.min(
      scenario.max_rpm,
      (1000 * settings.speed_m_min) / (Math.PI * diameter),
    );
    const speed = (rpm * Math.PI * diameter) / 1000;
    const minutes = (scenario.length_mm + scenario.approach_mm) / (feed * rpm);
    const life =
      scenario.life_reference_minutes *
      (scenario.life_reference_speed_m_min / speed) ** (1 / scenario.taylor_n) *
      (0.18 / feed) ** scenario.feed_life_exponent;
    const depth = (previousDiameter - diameter) / 2;
    previousDiameter = diameter;
    return {
      diameter_mm: diameter,
      depth_mm: depth,
      rpm,
      actual_speed_m_min: speed,
      cutting_minutes: minutes,
      wear_increment: minutes / life,
    };
  });
  const cutting = passes.reduce((sum, pass) => sum + pass.cutting_minutes, 0);
  const damage = passes.reduce((sum, pass) => sum + pass.wear_increment, 0);
  return {
    profile: {
      points: Array.from({ length: 201 }, (_, index) => {
        const x = index / 200;
        const distance = ((x + feed / 2) % feed) - feed / 2;
        return { x_mm: x, y_um: (1000 * distance ** 2) / (2 * radius) };
      }),
      feed_mm_rev: feed,
      height_um: (1000 * feed ** 2) / (8 * radius),
      width_mm: 1,
    },
    cutting_minutes: cutting,
    cycle_minutes: cutting + scenario.handling_minutes,
    rpm_by_pass: passes.map((pass) => pass.rpm),
    theoretical_ra_um: (1000 * feed ** 2) / (32 * radius),
    tool_life_minutes: cutting / damage,
    passes: passes.length,
    pass_details: passes,
    wear_per_part: damage,
    removed_volume_cm3:
      ((Math.PI / 4) *
        (scenario.initial_diameter_mm ** 2 - scenario.final_diameter_mm ** 2) *
        scenario.length_mm) /
      1000,
  };
}

// A separate Mulberry32 stream per piece keeps inspection independent of process noise.
export function partQuality(
  settings: Settings,
  scenario: Scenario,
  theoreticalRa: number,
  number: number,
  wear: number,
) {
  let state = settings.seed ^ Math.imul(number, 0x9e3779b9);
  const uniform = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const magnitude = Math.sqrt(-2 * Math.log(1 - uniform()));
  const angle = 2 * Math.PI * uniform();
  const ra = Math.max(
    0,
    theoreticalRa +
      scenario.roughness_floor_um +
      scenario.roughness_wear_um * wear ** 3 +
      scenario.roughness_sigma_um * magnitude * Math.cos(angle),
  );
  const diameter =
    scenario.final_diameter_mm +
    scenario.diameter_wear_mm * wear ** 2 +
    scenario.diameter_sigma_mm * magnitude * Math.sin(angle);
  return {
    ra_um: ra,
    diameter_mm: diameter,
    good:
      ra <= scenario.ra_limit_um &&
      Math.abs(diameter - scenario.final_diameter_mm) <=
        scenario.diameter_tolerance_mm,
  };
}
