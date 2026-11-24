export function createRunId(cryptoApi?: Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>): string;
