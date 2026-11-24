import assert from "node:assert/strict";
import { test } from "node:test";
import { webcrypto } from "node:crypto";
import { createRunId } from "../src/run-id.js";

test("uses native UUID when available", () => {
  assert.equal(createRunId({ randomUUID() { return "native-id"; } }), "native-id");
});

test("HTTP context without randomUUID produces distinct valid UUID v4 IDs", () => {
  const httpCrypto = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };
  const ids = Array.from({ length: 1000 }, () => createRunId(httpCrypto));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
