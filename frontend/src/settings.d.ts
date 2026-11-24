import type { Session, Settings } from "./types";
export function validSettings(value: unknown): value is Settings;
export function persistableSession(
  session: Session,
  lastValidSettings: Settings,
): Session;
