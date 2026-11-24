"""Release decisions, observation timing and measurement-plan invariants."""
import copy
import unittest
from unittest.mock import patch

from pydantic import ValidationError
from simulator.engine import simulate
from simulator.process import get_scenario, process_parameters
from simulator.schemas import Settings


class ReleaseTests(unittest.TestCase):
    def test_final_control_replenishes_known_rejects_and_meets_target(self):
        result = simulate(Settings(mode="week", quantity=100, change_after_parts=80,
                                   release_policy="final", stop_on_reject=True))
        s = result["summary"]
        self.assertTrue(s["release_on_time"])
        self.assertEqual(s["released"], 100)
        self.assertEqual(s["pending_release"], 0)
        self.assertGreater(s["supplemental_produced"], 0)
        self.assertGreater(s["final_inspections"], 0)
        self.assertEqual(s["good"], s["released"])

    def test_no_duplicate_inspection_cost_or_events(self):
        result = simulate(Settings(mode="week", quantity=100, release_policy="final"))
        s = result["summary"]
        self.assertEqual(s["inspected"], s["produced"])
        self.assertAlmostEqual(s["downtime_minutes"]["inspection"], s["inspected"] * 1.2)
        event_parts = [e["part_number"] for e in result["events"] if e["kind"] == "inspection"]
        # 100 pieces finish inside one shift: one event per inspected piece.
        self.assertEqual(len(event_parts), len(set(event_parts)))
        self.assertEqual(s["inspected"], s["final_inspections"] + sum(p["inspection_kind"] == "sample" for p in result["parts"]))

    def test_sample_never_releases_hidden_good(self):
        result = simulate(Settings(quantity=10))
        s = result["summary"]
        self.assertEqual(s["good"], 10)
        self.assertEqual(s["released"], 3)
        self.assertEqual(s["pending_release"], 7)
        self.assertFalse(s["release_on_time"])
        for part in result["parts"]:
            self.assertEqual(part["observed_time_minutes"] is None, not part["inspected"])

    def test_meeting_true_target_does_not_skip_final_release_work(self):
        result = simulate(Settings(mode="week", quantity=10, release_policy="final"))
        self.assertEqual(result["summary"]["inspected"], 10)
        self.assertEqual(result["summary"]["final_inspections"], 7)

    def test_week_capacity_can_prevent_replenishment(self):
        result = simulate(Settings(mode="week", quantity=800, release_policy="final",
                                   change_after_parts=80))
        s = result["summary"]
        self.assertFalse(s["release_on_time"])
        self.assertLess(s["released"], 800)
        self.assertAlmostEqual(s["working_minutes"], 2400)
        self.assertEqual(s["produced"], s["released"] + s["detected_rejects"] + s["pending_release"])
        self.assertAlmostEqual(s["total_cost_eur"], sum(s["cost_breakdown_eur"].values()))

    def test_final_inspection_pauses_over_shift_and_preserves_unknown_at_week_end(self):
        scenario = copy.deepcopy(get_scenario("steel-shaft"))
        process = process_parameters(Settings(), scenario)
        # First piece sample-inspected, second cut finished, final inspection starts.
        first_batch = 2 * process["cycle_minutes"] + scenario["inspection_minutes"]
        scenario.update(days=1, shift_minutes=first_batch + .1)
        with patch("simulator.engine.get_scenario", return_value=scenario):
            r = simulate(Settings(mode="week", quantity=2, inspect_every=100, release_policy="final"))
        self.assertEqual(r["summary"]["produced"], 2)
        self.assertEqual(r["summary"]["released"], 1)
        self.assertEqual(r["summary"]["pending_release"], 1)
        self.assertEqual(r["summary"]["unfinished_operation"], "inspection")
        self.assertIsNone(r["parts"][1]["observed_good"])
        scenario.update(days=2)
        with patch("simulator.engine.get_scenario", return_value=scenario):
            r = simulate(Settings(mode="week", quantity=2, inspect_every=100, release_policy="final"))
        self.assertEqual(r["summary"]["released"], 2)
        self.assertGreater(r["summary"]["downtime_minutes"]["shift_wait"], 0)

    def test_zero_release_cost_is_explicit(self):
        r = simulate(Settings(quantity=3, feed_mm_rev=.4, release_policy="final"))
        self.assertEqual(r["summary"]["released"], 0)
        self.assertIsNone(r["summary"]["cost_per_released_eur"])

    def test_offset_changes_observations_not_physics_with_equal_budget(self):
        a = simulate(Settings(quantity=80, change_after_parts=80, inspect_every=40))
        b = simulate(Settings(quantity=80, change_after_parts=80, inspect_every=40, inspection_offset=10))
        self.assertEqual(a["summary"]["inspected"], b["summary"]["inspected"])
        self.assertNotEqual([p["age_on_edge"] for p in a["parts"] if p["inspected"]],
                            [p["age_on_edge"] for p in b["parts"] if p["inspected"]])
        for x, y in zip(a["parts"], b["parts"]):
            for key in ("ra_um", "diameter_mm", "wear", "good", "tool_number"):
                self.assertEqual(x[key], y[key])
        self.assertAlmostEqual(a["summary"]["working_minutes"], b["summary"]["working_minutes"])

    def test_offset_bounds_and_repeatability(self):
        for bad in (dict(inspect_every=5, inspection_offset=5), dict(inspection_offset=-1)):
            with self.assertRaises(ValidationError):
                Settings(**bad)
        settings = Settings(release_policy="final", quantity=50, seed=2718, inspection_offset=2)
        a = simulate(settings)
        self.assertEqual(a, simulate(settings))
        b = simulate(settings.model_copy(update={"logging": False}))
        self.assertEqual(a["parts"], b["parts"])
        self.assertEqual(a["summary"], b["summary"])
        self.assertEqual(a["playback_events"], b["playback_events"])
        self.assertEqual(b["events"], [])

    def test_profile_uses_fixed_axes_and_feed_dependent_geometry(self):
        a = process_parameters(Settings(feed_mm_rev=.1), get_scenario("steel-shaft"))["profile"]
        b = process_parameters(Settings(feed_mm_rev=.2), get_scenario("steel-shaft"))["profile"]
        self.assertEqual(a["width_mm"], b["width_mm"])
        self.assertAlmostEqual(b["height_um"], 4 * a["height_um"])
        self.assertEqual(len(a["points"]), 201)
        self.assertTrue(all(0 <= p["y_um"] <= a["height_um"] + 1e-9 for p in a["points"]))


if __name__ == "__main__":
    unittest.main()
