import assert from "node:assert/strict";
import { test } from "node:test";
import { CACHE_PREFIX, decodeCache, encodeCache } from "../src/cache.js";
import LZString from "lz-string";
import { persistableSession, validSettings } from "../src/settings.js";

test("first compressed format remains readable", () => {
  const session = { runs: [], reflection: "Bestaande oefening" };
  const text = JSON.stringify(session);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const legacy = `coock:lz1:${(hash >>> 0).toString(16).padStart(8, "0")}:${LZString.compressToUTF16(text)}`;
  assert.deepEqual(decodeCache(legacy), session);
});

test("invalid numeric drafts preserve prior settings, trials and new notes", () => {
  const settings = {
    scenario_id: "steel-shaft",
    mode: "trial",
    speed_m_min: 180,
    feed_mm_rev: 0.18,
    change_after_parts: 20,
    inspect_every: 5,
    quantity: 10,
    seed: 42,
    logging: true,
    stop_on_reject: false,
    release_policy: "sample",
    inspection_offset: 0,
  };
  for (const invalid of [0, NaN, null, 301]) {
    const session = {
      settings: { ...settings, speed_m_min: invalid },
      prediction: "Nieuwe notitie",
      runs: [{ id: "proef-1", result: { good: 10 } }],
    };
    assert.equal(validSettings(session.settings), false);
    const restored = decodeCache(
      encodeCache(persistableSession(session, settings)),
    );
    assert.deepEqual(restored.settings, settings);
    assert.deepEqual(restored.runs, session.runs);
    assert.equal(restored.prediction, "Nieuwe notitie");
  }
});

test("compressed cache round-trips every session field and Unicode exactly", () => {
  const session = {
    format: "coock-workshop-v1",
    baseline: "id-1",
    prediction: "Ø24 ±0,03 µm → België 🛠",
    runs: [
      {
        id: "id-1",
        result: {
          parts: [{ ra_um: 1.23456789012345, observed_good: null, good: true }],
        },
      },
    ],
  };
  assert.deepEqual(decodeCache(encodeCache(session)), session);
  assert.ok(encodeCache(session).startsWith(CACHE_PREFIX));
});

test("legacy uncompressed JSON remains readable and migrates on save", () => {
  const legacy = {
    format: "coock-workshop-v1",
    runs: [],
    reflection: "Bewaar deze tekst.",
  };
  const loaded = decodeCache(JSON.stringify(legacy));
  assert.deepEqual(loaded, legacy);
  assert.ok(encodeCache(loaded).startsWith(CACHE_PREFIX));
});

test("truncated or altered cache is rejected rather than partly restored", () => {
  const stored = encodeCache({
    result: "Belangrijke productiegegevens ".repeat(1000),
  });
  assert.throws(() => decodeCache(stored.slice(0, -4)));
  assert.throws(() =>
    decodeCache(stored.replace(CACHE_PREFIX, `${CACHE_PREFIX}0`)),
  );
  assert.throws(() => decodeCache("geen JSON"));
});

test("twelve large result histories fit substantially below a typical browser quota", () => {
  const parts = Array.from({ length: 5000 }, (_, index) => ({
    number: index + 1,
    ra_um: 0.2 + (index % 20) / 10,
    diameter_mm: 24 + (index % 20) / 10000,
    time_minutes: index * 2.11234,
    wear: (index % 20) / 20,
    good: true,
    inspected: index % 5 === 0,
    observed_good: index % 5 === 0 ? true : null,
    tool_number: Math.floor(index / 20) + 1,
  }));
  const events = parts.flatMap((part) =>
    ["handling", "cutting", "inspection"].map((kind) => ({
      kind,
      start_minutes: part.time_minutes,
      duration_minutes: 0.8765,
      part_number: part.number,
    })),
  );
  const session = {
    runs: Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      result: { parts, events },
    })),
  };
  const plain = JSON.stringify(session);
  const compressed = encodeCache(session);
  assert.deepEqual(decodeCache(compressed), session);
  assert.ok(compressed.length < plain.length / 3);
  assert.ok(compressed.length * 2 < 4_500_000);
  console.log(
    JSON.stringify({
      plain_utf16_bytes: plain.length * 2,
      compressed_utf16_bytes: compressed.length * 2,
      ratio: compressed.length / plain.length,
    }),
  );
});

test("inspection offset must remain inside period and policies are explicit", () => {
  const b = {
    scenario_id: "steel-shaft",
    mode: "trial",
    speed_m_min: 180,
    feed_mm_rev: 0.18,
    change_after_parts: 20,
    inspect_every: 5,
    quantity: 10,
    seed: 42,
    logging: true,
    stop_on_reject: false,
    release_policy: "final",
    inspection_offset: 4,
  };
  assert.equal(validSettings(b), true);
  assert.equal(validSettings({ ...b, inspection_offset: 5 }), false);
  assert.equal(validSettings({ ...b, release_policy: "magic" }), false);
});

import { reuseSettings, recordDecision, orderStatus } from "../src/ux.js";
test("reuse copies all settings without mutating result or unrelated policy", () => {
  const original = {
    mode: "trial",
    quantity: 10,
    feed_mm_rev: 0.18,
    seed: 43,
    inspection_offset: 3,
    release_policy: "sample",
  };
  assert.deepEqual(reuseSettings(original), original);
  assert.notEqual(reuseSettings(original), original);
  assert.deepEqual(reuseSettings(original, "week"), {
    ...original,
    mode: "week",
    quantity: 800,
  });
  assert.deepEqual(reuseSettings(original, "final"), {
    ...original,
    release_policy: "final",
  });
  assert.equal(original.release_policy, "sample");
});
test("decisions preserve original answer and mark revisions after reveal", () => {
  const legacy = { id: "old", result: { good: 800 } };
  const first = recordDecision(
    legacy,
    "Geen bewijs",
    "2026-11-15T12:00:00.000Z",
  );
  const revised = recordDecision(
    { ...first, revealedAt: "2026-11-15T12:01:00.000Z" },
    "Nu wel",
    "2026-11-15T12:02:00.000Z",
  );
  assert.equal(first.decisions.length, 1);
  assert.equal(first.decisions[0].afterReveal, false);
  assert.equal(revised.decisions.length, 2);
  assert.equal(revised.decisions[1].afterReveal, true);
  assert.equal(revised.decisions[0].value, "Geen bewijs");
  assert.equal(revised.result, legacy.result);
  assert.deepEqual(decodeCache(encodeCache(revised)), revised);
});
test("order decision uses released status, not hidden good output or elapsed calendar", () => {
  const s = {
    release_on_time: false,
    unused_minutes: 953.66,
    good: 800,
    elapsed_minutes: 4326.34,
  };
  assert.match(orderStatus(s), /nog niet volledig/);
  assert.match(orderStatus({ ...s, unused_minutes: 0 }), /binnen het rooster/);
  assert.match(
    orderStatus({ ...s, unused_minutes: 2.1e-10 }),
    /binnen het rooster/,
  );
  assert.match(
    orderStatus({ ...s, release_on_time: true }),
    /op tijd volledig/,
  );
});

import { validDecisionHistory, discloseRuns } from "../src/ux.js";
test("legacy decisions remain compatible while contradictory disclosure metadata is rejected", () => {
  assert.equal(validDecisionHistory({}), true);
  const before = {
    value: "Nog onvoldoende",
    at: "2026-11-15T10:00:00.000Z",
    afterReveal: false,
  };
  const after = {
    value: "Besproken",
    at: "2026-11-15T10:02:00.000Z",
    afterReveal: true,
  };
  const run = {
    decisions: [before, after],
    revealedAt: "2026-11-15T10:01:00.000Z",
  };
  assert.equal(validDecisionHistory(run), true);
  assert.equal(
    validDecisionHistory({ ...run, decisions: [after, before] }),
    false,
  );
  assert.equal(validDecisionHistory({ decisions: [after] }), false);
  assert.equal(
    validDecisionHistory({ ...run, decisions: [{ ...before, at: after.at }] }),
    false,
  );
  assert.equal(
    validDecisionHistory({ ...run, decisions: [{ ...after, at: before.at }] }),
    false,
  );
  assert.equal(
    validDecisionHistory({ ...run, decisions: [{ ...before, value: "" }] }),
    false,
  );
  assert.equal(validDecisionHistory({ ...run, revealedAt: "invalid" }), false);
});
test("session export records disclosure for every run without changing results or initial answers", () => {
  const at = "2026-11-15T10:01:00.000Z";
  const original = [
    {
      id: "one",
      result: { good: 10 },
      decisions: [
        {
          value: "Nog niet",
          at: "2026-11-15T10:00:00.000Z",
          afterReveal: false,
        },
      ],
    },
    { id: "two", result: { good: 0 }, revealedAt: "2026-11-15T09:00:00.000Z" },
  ];
  const exported = discloseRuns(original, at);
  assert.equal(original[0].revealedAt, undefined);
  assert.equal(exported[0].revealedAt, at);
  assert.equal(exported[1].revealedAt, original[1].revealedAt);
  assert.equal(exported[0].result, original[0].result);
  assert.equal(exported[0].decisions, original[0].decisions);
  assert.equal(validDecisionHistory(exported[0]), true);
  assert.equal(
    recordDecision(
      exported[0],
      "Na export",
      "2026-11-15T10:02:00.000Z",
    ).decisions.at(-1).afterReveal,
    true,
  );
});

import { initialView, settingChanges, measurementEvidence, calculateTrial } from '../src/ux.js';
import { changeGroups, trialTitle } from '../src/ux.js';

test('task transitions do not count as multiple changed process factors', () => {
  const source = { mode: 'trial', quantity: 10, speed_m_min: 180, feed_mm_rev: 0.18, release_policy: 'sample' };
  const week = {...source, mode: 'week', quantity: 800};
  assert.equal(changeGroups(source, week).task.length, 2);
  assert.equal(changeGroups(source, week).process.length, 0);
  assert.equal(changeGroups(source, {...week, feed_mm_rev: 0.3}).process.length, 1);
  assert.equal(changeGroups(source, {...week, feed_mm_rev: 0.3, release_policy: 'final'}).process.length, 2);
});

test('trial identity is shown once while custom names remain visible', () => {
  assert.equal(trialTitle(4, 'Proef 5'), 'Proef 5');
  assert.equal(trialTitle(4, ' proef 5 '), 'Proef 5');
  assert.equal(trialTitle(4, 'Sneller draaien'), 'Proef 5 · Sneller draaien');
  assert.equal(trialTitle(4), 'Proef 5');
});
test('draft and executed result are distinguished across reload and complete setting changes', () => {
  const executed = { scenario_id:'steel-shaft', mode:'trial', speed_m_min:180, feed_mm_rev:0.18, change_after_parts:20, inspect_every:5, quantity:10, seed:42, logging:true, stop_on_reject:false, release_policy:'sample', inspection_offset:0 };
  assert.equal(initialView(executed), 'concept');
  assert.equal(initialView({...executed}, executed), 'result');
  for (const [key, value] of Object.entries(executed)) {
    const changed = {...executed, [key]: typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : value + '-changed'};
    assert.equal(initialView(changed, executed), 'concept', key);
    assert.equal(settingChanges(executed, changed).length, 1, key);
    assert.equal(initialView({...executed}, executed), 'result');
  }
  assert.equal(initialView({...executed, feed_mm_rev:NaN}, executed), 'concept');
});
test('measurement evidence never treats unknown pieces as rejects', () => {
  assert.deepEqual(measurementEvidence({inspected:3,detected_rejects:0,uninspected:7}), {good:3,measured:3,rejects:0,unknown:7});
  assert.deepEqual(measurementEvidence({inspected:201,detected_rejects:201,uninspected:800}), {good:0,measured:201,rejects:201,unknown:800});
  assert.deepEqual(measurementEvidence({inspected:0,detected_rejects:0,uninspected:0}), {good:0,measured:0,rejects:0,unknown:0});
  assert.deepEqual(measurementEvidence({inspected:8,detected_rejects:2,uninspected:4}), {good:6,measured:8,rejects:2,unknown:4});
});
test('calculation snapshots draft and leaves it intact when request fails', async () => {
  const draft = {speed_m_min:180, feed_mm_rev:0.18};
  let submitted;
  const request = calculateTrial(draft, async s => { submitted=s; throw new Error('offline'); });
  draft.speed_m_min=240;
  await assert.rejects(request, /offline/);
  assert.equal(submitted.speed_m_min,180);
  assert.equal(draft.speed_m_min,240);
  const response={summary:{released:3}};
  assert.equal(await calculateTrial(draft, async () => response),response);
});
