import LZString from "lz-string";

// Keep the on-disk session format plain JSON; compression is only a browser cache concern.
export const CACHE_PREFIX = "coock:";
const SINGLE_PREFIX = `${CACHE_PREFIX}lz1:`;
const SESSION_PREFIX = `${CACHE_PREFIX}lz2:`;
const resultCache = new WeakMap();

function checksum(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function encodeSingle(value) {
  const text = JSON.stringify(value);
  return `${SINGLE_PREFIX}${checksum(text)}:${LZString.compressToUTF16(text)}`;
}

function verifyPayload(payload, compressed) {
  if (payload[8] !== ":") throw Error("Ongeldige browseropslag.");
  const text = compressed
    ? LZString.decompressFromUTF16(payload.slice(9))
    : payload.slice(9);
  if (typeof text !== "string" || checksum(text) !== payload.slice(0, 8)) {
    throw Error("Beschadigde browseropslag.");
  }
  return JSON.parse(text);
}

export function encodeCache(value) {
  if (
    !value ||
    !Array.isArray(value.runs) ||
    !value.runs.every(
      (run) => run && run.result && typeof run.result === "object",
    )
  ) {
    return encodeSingle(value);
  }
  // Results are immutable: editing settings or notes reuses their compressed bytes.
  // Keep small participant metadata separate, so saving a keystroke never recompresses a week.
  const runs = value.runs.map((run) => {
    let compressed = resultCache.get(run.result);
    if (!compressed) {
      compressed = encodeSingle(run.result);
      resultCache.set(run.result, compressed);
    }
    return { ...run, result: compressed };
  });
  const text = JSON.stringify({ ...value, runs });
  return `${SESSION_PREFIX}${checksum(text)}:${text}`;
}

export function decodeCache(stored) {
  if (stored.startsWith(SESSION_PREFIX)) {
    const value = verifyPayload(stored.slice(SESSION_PREFIX.length), false);
    if (!value || !Array.isArray(value.runs))
      throw Error("Ongeldige browseropslag.");
    const runs = value.runs.map((run) => {
      if (!run || typeof run.result !== "string")
        throw Error("Ongeldige proef in browseropslag.");
      const result = decodeCache(run.result);
      if (result && typeof result === "object")
        resultCache.set(result, run.result);
      return { ...run, result };
    });
    return { ...value, runs };
  }
  if (stored.startsWith(SINGLE_PREFIX))
    return verifyPayload(stored.slice(SINGLE_PREFIX.length), true);
  // Transparently migrate the original uncompressed cache on the next successful save.
  return JSON.parse(stored);
}
