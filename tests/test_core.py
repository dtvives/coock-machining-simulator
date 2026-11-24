"""Behavior and balance checks independent from the HTTP/UI layers."""

import copy
import math
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from simulator.engine import Schedule, simulate
from simulator.process import get_scenario, process_parameters
from simulator.schemas import Settings


class CoreTests(unittest.TestCase):
    def run_case(self, **kwargs):
        return simulate(Settings(**kwargs))

    def test_geometry_and_hand_calculated_time(self):
        config = Settings(speed_m_min=180.0, feed_mm_rev=0.18)
        p = process_parameters(config, get_scenario("steel-shaft"))
        expected = sum(82 * math.pi * d / (0.18 * 180000) for d in [28, 26, 24])
        self.assertAlmostEqual(p["cutting_minutes"], expected)
        self.assertAlmostEqual(p["removed_volume_cm3"], math.pi / 4 * 324 * 80 / 1000)
        self.assertEqual(p["passes"], 3)
        self.assertAlmostEqual(p["theoretical_ra_um"], 1.265625)

    def test_spindle_limit_applies_to_speed_and_time(self):
        p = process_parameters(Settings(speed_m_min=300.0), get_scenario("steel-shaft"))
        self.assertEqual(p["rpm_by_pass"][-1], 3500)
        self.assertLess(p["pass_details"][-1]["actual_speed_m_min"], 300)

    def test_counts_cost_and_time_balance(self):
        result = self.run_case(mode="week", quantity=5000)
        s = result["summary"]
        self.assertEqual(s["produced"], s["good"] + s["rejected"])
        self.assertEqual(s["produced"], s["inspected"] + s["uninspected"])
        self.assertAlmostEqual(s["working_minutes"], s["cutting_minutes"] + sum(v for k, v in s["downtime_minutes"].items() if k != "shift_wait"))
        self.assertAlmostEqual(s["elapsed_minutes"], s["working_minutes"] + s["downtime_minutes"]["shift_wait"])
        self.assertAlmostEqual(s["available_minutes"], s["working_minutes"] + s["unused_minutes"])
        self.assertAlmostEqual(s["total_cost_eur"], sum(s["cost_breakdown_eur"].values()))
        self.assertLessEqual(s["working_minutes"], 2400 + 1e-8)
        self.assertFalse(s["on_time"])
        self.assertGreaterEqual(s["total_cost_eur"], 0)

    def test_no_events_outside_shifts_or_negative(self):
        result = self.run_case(mode="week", quantity=5000)
        for e in result["events"]:
            self.assertGreater(e["duration_minutes"], 0)
            if e["kind"] != "shift_wait":
                within = e["start_minutes"] % 1440
                self.assertLess(within, 480)
                self.assertLessEqual(within + e["duration_minutes"], 480 + 1e-8)

    def test_continuous_wear_and_edge_reset(self):
        result = self.run_case(quantity=5, change_after_parts=2)
        p = result["parts"]
        increment = result["process"]["wear_per_part"]
        for row, age in zip(p, [1, 2, 1, 2, 1]):
            self.assertAlmostEqual(row["wear"], age * increment)
        self.assertEqual([row["tool_number"] for row in p], [1, 1, 2, 2, 3])
        self.assertEqual(result["summary"]["tool_changes"], 2)

    def test_repeatable_and_logging_changes_only_observation(self):
        first = self.run_case(quantity=50)
        self.assertEqual(first, self.run_case(quantity=50))
        no_log = self.run_case(quantity=50, logging=False)
        self.assertEqual(first["parts"], no_log["parts"])
        self.assertEqual(first["summary"], no_log["summary"])
        self.assertEqual(no_log["events"], [])
        other_seed = self.run_case(quantity=50, seed=43)
        self.assertNotEqual(first["parts"][0]["ra_um"], other_seed["parts"][0]["ra_um"])

    def test_inspection_alone_does_not_change_physics(self):
        first = self.run_case(quantity=50, inspect_every=1)
        second = self.run_case(quantity=50, inspect_every=50)
        for a, b in zip(first["parts"], second["parts"]):
            for field in ("ra_um", "diameter_mm", "good", "wear", "tool_number"):
                self.assertEqual(a[field], b[field])
        self.assertGreater(first["summary"]["working_minutes"], second["summary"]["working_minutes"])

    def test_zero_good_has_no_infinite_or_zero_unit_cost(self):
        result = self.run_case(feed_mm_rev=0.4, quantity=10)
        self.assertEqual(result["summary"]["good"], 0)
        self.assertIsNone(result["summary"]["cost_per_good_eur"])
        self.assertFalse(result["summary"]["on_time"])

    def test_unknown_quality_is_not_reported_as_inspected(self):
        result = self.run_case(quantity=10, inspect_every=5)
        self.assertEqual([p["number"] for p in result["parts"] if p["inspected"]], [1, 5, 10])
        for p in result["parts"]:
            self.assertEqual(p["observed_good"], p["good"] if p["inspected"] else None)

    def test_week_stops_on_known_information_not_hidden_quality(self):
        # All parts fail, but only #1 is inspected. No hidden-good replenishment.
        result = self.run_case(mode="week", quantity=10, feed_mm_rev=0.4, inspect_every=100)
        self.assertEqual(result["summary"]["produced"], 11)
        self.assertEqual(result["summary"]["nominal_accepted"], 10)
        self.assertEqual(result["summary"]["good"], 0)
        self.assertFalse(result["summary"]["on_time"])

    def test_measured_rejection_can_trigger_action(self):
        result = self.run_case(feed_mm_rev=0.4, quantity=3, inspect_every=1, stop_on_reject=True)
        self.assertEqual(result["summary"]["tool_changes"], 2)
        self.assertEqual([p["tool_number"] for p in result["parts"]], [1, 2, 3])

    def test_pause_resume_and_partial_operations(self):
        clock = Schedule(days=2, shift_minutes=10)
        self.assertEqual(clock.consume("cutting", 15, 1), 15)
        self.assertEqual(clock.now, 1445)
        self.assertEqual(clock.totals["shift_wait"], 1430)
        self.assertEqual(clock.consume("inspection", 10, 1), 5)
        self.assertEqual(clock.now, 1450)
        self.assertEqual(clock.working, 20)

    def test_final_partial_cut_is_charged_but_not_counted(self):
        scenario = copy.deepcopy(get_scenario("steel-shaft"))
        scenario.update(days=1, shift_minutes=1.0)
        with patch("simulator.engine.get_scenario", return_value=scenario):
            result = self.run_case(quantity=1)
        s = result["summary"]
        self.assertEqual(s["produced"], 0)
        self.assertEqual(s["loaded_stock"], 1)
        self.assertEqual(s["unfinished_operation"], "cutting")
        self.assertGreater(s["final_wear"], 0)
        self.assertAlmostEqual(s["working_minutes"], 1)
        self.assertGreater(s["total_cost_eur"], 12)

    def test_incomplete_inspection_preserves_finished_piece(self):
        scenario = copy.deepcopy(get_scenario("steel-shaft"))
        p = process_parameters(Settings(), scenario)
        scenario.update(days=1, shift_minutes=p["cycle_minutes"] + 0.1)
        with patch("simulator.engine.get_scenario", return_value=scenario):
            result = self.run_case(quantity=1)
        self.assertEqual(result["summary"]["produced"], 1)
        self.assertEqual(result["summary"]["inspected"], 0)
        self.assertIsNone(result["parts"][0]["observed_good"])
        self.assertEqual(result["summary"]["unfinished_operation"], "inspection")

    def test_strict_input_validation(self):
        for invalid in [dict(speed_m_min=0.0), dict(feed_mm_rev=float("nan")), dict(quantity=True), dict(seed=-1), dict(quantity=5001), dict(unknown=1), dict(logging="false")]:
            with self.subTest(invalid=invalid), self.assertRaises(ValidationError):
                Settings(**invalid)

    def test_scenario_and_extreme_parameter_sweep(self):
        for scenario in ["steel-shaft", "tight-finish"]:
            for speed, feed, interval in [(80.0, 0.08, 1), (300.0, 0.4, 200), (180.0, 0.18, 20)]:
                with self.subTest(scenario=scenario, speed=speed, feed=feed):
                    result = self.run_case(scenario_id=scenario, speed_m_min=speed, feed_mm_rev=feed, change_after_parts=interval, quantity=200, seed=2718)
                    summary = result["summary"]
                    self.assertEqual(summary["produced"], summary["good"] + summary["rejected"])
                    for value in [summary["total_cost_eur"], summary["working_minutes"], summary["final_wear"]]:
                        self.assertTrue(math.isfinite(value))
                        self.assertGreaterEqual(value, 0)
                    for row in result["parts"]:
                        self.assertGreaterEqual(row["ra_um"], 0)
                        self.assertGreater(row["diameter_mm"], 0)

    def test_incomplete_change_spends_time_without_installing_edge(self):
        scenario = copy.deepcopy(get_scenario("steel-shaft"))
        p = process_parameters(Settings(), scenario)
        scenario.update(days=1, shift_minutes=p["cycle_minutes"] + scenario["inspection_minutes"] + 0.5)
        with patch("simulator.engine.get_scenario", return_value=scenario):
            result = self.run_case(quantity=2, change_after_parts=1)
        self.assertEqual(result["summary"]["produced"], 1)
        self.assertEqual(result["summary"]["tool_changes"], 0)
        self.assertEqual(result["summary"]["tools_used"], 1)
        self.assertEqual(result["summary"]["unfinished_operation"], "tool_change")
        self.assertAlmostEqual(result["summary"]["downtime_minutes"]["tool_change"], 0.5)


if __name__ == "__main__":
    unittest.main()
