import type { Settings, Run, Result } from "./types";
export function reuseSettings(
  settings: Settings,
  purpose?: "same" | "week" | "final",
): Settings;
export function recordDecision(run: Run, value: string, at?: string): Run;
export function orderStatus(summary: Result["summary"]): string;

export function validDecisionHistory(run: Run): boolean;
export function discloseRuns(runs: Run[], at?: string): Run[];
export function settingChanges(source: Settings, draft: Settings): string[];
export function changeGroups(source: Settings, draft: Settings): {task: string[]; process: string[]};
export function trialTitle(index: number, name?: string): string;
export function initialView(draft: Settings, executed?: Settings): "concept" | "result";
export function measurementEvidence(summary: Pick<Result["summary"], "inspected" | "detected_rejects" | "uninspected">): {good: number; measured: number; rejects: number; unknown: number};
export function calculateTrial(settings: Settings, calculate: (settings: Settings) => Promise<Result>): Promise<Result>;
