import assert from "node:assert/strict";
import test from "node:test";
import { csv, markdown } from "../src/exports.ts";
import { scenarios } from "../src/process.ts";
import { MODEL_VERSION, simulate } from "../src/simulation.ts";

const settings = {
  ...scenarios.find(({ id }) => id === "steel-shaft").defaults,
  scenario_id: "steel-shaft",
  mode: "trial",
  release_policy: "sample",
  inspection_offset: 0,
};

test("korte proef met tien stukken, steekproef en lokale exports", () => {
  const result = simulate(settings);
  assert.deepEqual(simulate(settings), result);
  assert.equal(result.model_version, MODEL_VERSION);
  assert.equal(result.summary.produced, 10);
  assert.deepEqual(
    result.parts.filter((part) => part.inspected).map((part) => part.number),
    [1, 5, 10],
  );
  assert.equal(result.summary.good + result.summary.rejected, 10);
  assert.ok(Math.abs(result.process.theoretical_ra_um - 1.265625) < 1e-12);
  assert.equal(csv(result).trimEnd().split("\r\n").length, 11);
  assert.match(markdown(result), /Geproduceerd 10/);

  const otherSample = simulate({ ...settings, inspect_every: 2 });
  assert.deepEqual(
    otherSample.parts.map(({ ra_um, diameter_mm }) => [ra_um, diameter_mm]),
    result.parts.map(({ ra_um, diameter_mm }) => [ra_um, diameter_mm]),
  );
  assert.throws(() => simulate({ ...settings, inspection_offset: 5 }));
});

test("weekorder van 800 stukken met eindcontrole binnen een vijfdaags rooster", () => {
  const order = {
    ...settings,
    mode: "week",
    quantity: 800,
    release_policy: "final",
    logging: false,
  };
  const result = simulate(order);
  const { summary, parts, playback_events } = result;
  assert.deepEqual(simulate(order), result);
  assert.equal(summary.order_target, 800);
  assert.equal(summary.released, 800);
  assert.equal(summary.release_on_time, true);
  assert.equal(summary.available_minutes, 2400);
  assert.ok(summary.working_minutes <= 2400 + 1e-9);
  assert.equal(
    playback_events.filter(({ kind }) => kind === "shift_wait").length,
    4,
  );
  assert.equal(summary.good + summary.rejected, summary.produced);
  assert.equal(summary.inspected + summary.uninspected, summary.produced);
  assert.equal(
    summary.released,
    parts.filter((part) => part.observed_good === true).length,
  );
  assert.equal(summary.release_on_time, summary.released >= order.quantity);
  assert.ok(summary.final_inspections > 0);
  assert.deepEqual(result.events, []);
});
