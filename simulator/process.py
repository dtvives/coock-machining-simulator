"""Geometry, cutting time, illustrative tool life and quality relationships."""

import json
import math
from pathlib import Path
from random import Random

from .schemas import Settings

SCENARIO_DIR = Path(__file__).resolve().parent.parent / "scenarios"


def load_scenarios() -> list[dict]:
    return [json.loads(path.read_text(encoding="utf-8")) for path in sorted(SCENARIO_DIR.glob("*.json"))]


def get_scenario(scenario_id: str) -> dict:
    for scenario in load_scenarios():
        if scenario["id"] == scenario_id:
            return scenario
    raise ValueError("Onbekend scenario.")


def tool_life(speed_m_min: float, feed_mm_rev: float, scenario: dict) -> float:
    """Taylor-type relation; constants are illustrative, not fitted to C45."""
    return (
        scenario["life_reference_minutes"]
        * (scenario["life_reference_speed_m_min"] / speed_m_min) ** (1 / scenario["taylor_n"])
        * (0.18 / feed_mm_rev) ** scenario["feed_life_exponent"]
    )


def process_parameters(settings: Settings, scenario: dict) -> dict:
    passes = []
    previous_diameter = scenario["initial_diameter_mm"]
    for diameter in scenario["pass_diameters_mm"]:
        rpm = min(scenario["max_rpm"], 1000 * settings.speed_m_min / (math.pi * diameter))
        actual_speed = rpm * math.pi * diameter / 1000
        minutes = (scenario["length_mm"] + scenario["approach_mm"]) / (settings.feed_mm_rev * rpm)
        passes.append({
            "diameter_mm": diameter, "depth_mm": (previous_diameter - diameter) / 2,
            "rpm": rpm, "actual_speed_m_min": actual_speed,
            "cutting_minutes": minutes,
            "wear_increment": minutes / tool_life(actual_speed, settings.feed_mm_rev, scenario),
        })
        previous_diameter = diameter
    cutting = sum(p["cutting_minutes"] for p in passes)
    damage = sum(p["wear_increment"] for p in passes)
    return {
        "profile": surface_profile(settings.feed_mm_rev, scenario["nose_radius_mm"]),
        "cutting_minutes": cutting,
        "cycle_minutes": cutting + scenario["handling_minutes"],
        "rpm_by_pass": [p["rpm"] for p in passes],
        "theoretical_ra_um": 1000 * settings.feed_mm_rev**2 / (32 * scenario["nose_radius_mm"]),
        "tool_life_minutes": cutting / damage,
        "passes": len(passes),
        "pass_details": passes,
        "wear_per_part": damage,
        "removed_volume_cm3": math.pi / 4 * (scenario["initial_diameter_mm"]**2 - scenario["final_diameter_mm"]**2) * scenario["length_mm"] / 1000,
    }


def surface_profile(feed: float, radius: float) -> dict:
    """Ideal repeated parabolic scallops; µm vertical, mm horizontal.

    The parabola is the same small-feed approximation underlying f²/(8r).
    It is geometric drawing data, never synthetic measured surface texture.
    """
    width = 1.0
    points = []
    for index in range(201):
        x = width * index / 200
        distance = ((x + feed / 2) % feed) - feed / 2
        points.append({"x_mm": x, "y_um": 1000 * distance**2 / (2 * radius)})
    return {"points": points, "feed_mm_rev": feed,
            "height_um": 1000 * feed**2 / (8 * radius), "width_mm": width}


def part_quality(settings: Settings, scenario: dict, process: dict, part_number: int, wear: float) -> tuple[float, float, bool]:
    # Separate per-part stream: observation settings never consume physics randomness.
    rng = Random(f"machining-1.0.0:{settings.seed}:{part_number}")
    ra = max(0.0, process["theoretical_ra_um"] + scenario["roughness_floor_um"] + scenario["roughness_wear_um"] * wear**3 + rng.gauss(0, scenario["roughness_sigma_um"]))
    diameter = scenario["final_diameter_mm"] + scenario["diameter_wear_mm"] * wear**2 + rng.gauss(0, scenario["diameter_sigma_mm"])
    good = ra <= scenario["ra_limit_um"] and abs(diameter - scenario["final_diameter_mm"]) <= scenario["diameter_tolerance_mm"]
    return ra, diameter, good
