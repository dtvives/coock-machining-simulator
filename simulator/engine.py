"""Discrete production operations, shift calendar, observation and costs.

No wall clock, animation state, network, or mutable global simulation state.
"""

from . import MODEL_VERSION
from .process import get_scenario, load_scenarios, part_quality, process_parameters
from .schemas import Settings


class Schedule:
    """Consume operation minutes over finite daily shifts, retaining partial work."""

    def __init__(self, days: int, shift_minutes: float):
        self.days = days
        self.shift = shift_minutes
        self.now = 0.0
        self.working = 0.0
        self.events: list[dict] = []
        self.totals = {kind: 0.0 for kind in ("handling", "cutting", "inspection", "tool_change", "shift_wait")}

    def _record(self, kind: str, duration: float, part_number: int | None) -> None:
        if duration <= 0:
            return
        self.events.append({"kind": kind, "start_minutes": self.now, "duration_minutes": duration, "part_number": part_number})
        self.now += duration
        self.totals[kind] += duration
        if kind != "shift_wait":
            self.working += duration

    def consume(self, kind: str, duration: float, part_number: int | None = None) -> float:
        remaining = duration
        while remaining > 1e-10:
            day = int(self.now // 1440)
            end = day * 1440 + self.shift
            if self.now >= end - 1e-10:
                if day + 1 >= self.days:
                    break
                self._record("shift_wait", (day + 1) * 1440 - self.now, None)
                continue
            used = min(remaining, end - self.now)
            self._record(kind, used, part_number)
            remaining -= used
        return duration - remaining


def simulate(settings: Settings) -> dict:
    """Return a self-contained reproducible run, with true and observed quality.

    Sample policy stops at the nominal quota. Final policy checks unknown parts,
    then replenishes measured deficits while scheduled time remains. No decision
    reads hidden quality; it is exposed only by a completed inspection.
    """
    scenario = get_scenario(settings.scenario_id)
    process = process_parameters(settings, scenario)
    clock = Schedule(scenario["days"], scenario["shift_minutes"])
    parts: list[dict] = []
    wear = 0.0
    edge_parts = 0
    tools_used = 1
    tool_changes = 0
    loaded_stock = 0
    detected_rejects = 0
    replace_after_detection = False
    unfinished_operation: str | None = None
    final_inspections = 0
    supplemental_produced = 0
    final_control_started = False

    def inspect(part: dict, kind: str) -> bool:
        nonlocal detected_rejects, replace_after_detection, unfinished_operation, final_inspections
        if part["inspected"]:
            return True
        duration = scenario["inspection_minutes"]
        used = clock.consume("inspection", duration, part["number"])
        if used < duration - 1e-9:
            unfinished_operation = "inspection"
            return False
        part["inspected"] = True
        part["inspection_kind"] = kind
        part["observed_time_minutes"] = clock.now
        part["observed_good"] = part["good"]
        if kind == "final":
            final_inspections += 1
        if not part["observed_good"]:
            detected_rejects += 1
            replace_after_detection = replace_after_detection or settings.stop_on_reject
        return True

    while True:
        produced = len(parts)
        nominal_accepted = produced - detected_rejects
        reached = produced >= settings.quantity if settings.mode == "trial" else nominal_accepted >= settings.quantity
        if reached:
            if settings.release_policy == "final":
                final_control_started = True
                for part in parts:
                    if not inspect(part, "final"):
                        break
                if unfinished_operation:
                    break
                # This decision sees completed inspections only, never hidden quality.
                released = sum(p["observed_good"] is True for p in parts)
                if settings.mode == "trial" or released >= settings.quantity:
                    break
            else:
                break
        number = produced + 1
        if edge_parts >= settings.change_after_parts or replace_after_detection:
            duration = scenario["tool_change_minutes"]
            used = clock.consume("tool_change", duration)
            if used < duration - 1e-9:
                unfinished_operation = "tool_change"
                break
            tools_used += 1
            tool_changes += 1
            wear = 0.0
            edge_parts = 0
            replace_after_detection = False

        # Stock is committed when loading begins, including a partial final load.
        if clock.working >= scenario["days"] * scenario["shift_minutes"] - 1e-9:
            break
        loaded_stock += 1
        handling = scenario["handling_minutes"]
        used = clock.consume("handling", handling, number)
        if used < handling - 1e-9:
            unfinished_operation = "handling"
            break

        fully_cut = True
        for cutting_pass in process["pass_details"]:
            duration = cutting_pass["cutting_minutes"]
            used = clock.consume("cutting", duration, number)
            wear += cutting_pass["wear_increment"] * used / duration
            if used < duration - 1e-9:
                fully_cut = False
                unfinished_operation = "cutting"
                break
        if not fully_cut:
            break

        edge_parts += 1
        ra, diameter, good = part_quality(settings, scenario, process, number, wear)
        part = {
            "number": number, "time_minutes": clock.now, "ra_um": ra,
            "diameter_mm": diameter, "wear": wear, "good": good,
            "inspected": False, "observed_good": None, "tool_number": tools_used,
            "inspection_kind": None, "observed_time_minutes": None,
            "age_on_edge": edge_parts,
        }
        parts.append(part)
        if final_control_started:
            supplemental_produced += 1
        if number == 1 or number % settings.inspect_every == settings.inspection_offset:
            if not inspect(part, "sample"):
                break

    good_count = sum(p["good"] for p in parts)
    inspected = sum(p["inspected"] for p in parts)
    released = sum(p["observed_good"] is True for p in parts)
    available = scenario["days"] * scenario["shift_minutes"]
    machine_cost = clock.working * scenario["machine_eur_hour"] / 60
    material_cost = loaded_stock * scenario["material_eur_part"]
    tool_cost = tools_used * scenario["edge_eur"]
    total_cost = machine_cost + material_cost + tool_cost
    return {
        "model_version": MODEL_VERSION,
        "settings": settings.model_dump(),
        "scenario_snapshot": scenario,
        "process": process,
        "summary": {
            "produced": len(parts), "good": good_count, "rejected": len(parts) - good_count,
            "released": released, "pending_release": len(parts) - inspected,
            "supplemental_produced": supplemental_produced,
            "final_inspections": final_inspections,
            "release_on_time": released >= settings.quantity,
            "cost_per_released_eur": total_cost / released if released else None,
            "inspected": inspected, "detected_rejects": detected_rejects,
            "uninspected": len(parts) - inspected,
            "nominal_accepted": len(parts) - detected_rejects,
            "accepted_unverified": len(parts) - inspected,
            "tools_used": tools_used, "tool_changes": tool_changes,
            "cutting_minutes": clock.totals["cutting"], "elapsed_minutes": clock.now,
            "working_minutes": clock.working, "available_minutes": available,
            "downtime_minutes": {kind: clock.totals[kind] for kind in ("handling", "inspection", "tool_change", "shift_wait")},
            "total_cost_eur": total_cost,
            "cost_per_good_eur": total_cost / good_count if good_count else None,
            "cost_breakdown_eur": {"machine": machine_cost, "material": material_cost, "tools": tool_cost},
            "on_time": good_count >= settings.quantity,
            "order_target": settings.quantity,
            "completion_fraction": min(1.0, good_count / settings.quantity),
            "final_wear": wear, "unused_minutes": max(0.0, available - clock.working),
            "loaded_stock": loaded_stock, "unfinished_operation": unfinished_operation,
        },
        "parts": parts,
        "events": clock.events if settings.logging else [],
        "playback_events": clock.events,
    }
