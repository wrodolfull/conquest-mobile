import { supabase } from "@/lib/supabase";
import { buildDomainSummary } from "./domainRules";
import type { ControlledTerritoryCell, DomainSummary } from "./domainTypes";
let cached: DomainSummary | undefined;
let request: Promise<DomainSummary> | undefined;
let generation = 0;
const listeners = new Set<() => void>();
const valid = (value: unknown): value is ControlledTerritoryCell => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.territoryId === "string" &&
    typeof row.name === "string" &&
    Number.isInteger(row.q) &&
    Number.isInteger(row.r)
  );
};
export const domainRepository = {
  getLatest: () => cached,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  invalidate() {
    generation++;
    cached = undefined;
    listeners.forEach((listener) => listener());
  },
  refresh() {
    if (request) return request;
    const current = ++generation;
    request = (async () => {
      const { data, error } = await supabase.rpc(
        "get_my_controlled_territory_cells",
      );
      if (error) throw error;
      const summary = buildDomainSummary(
        Array.isArray(data) ? data.filter(valid) : [],
      );
      if (current === generation) {
        cached = summary;
        listeners.forEach((listener) => listener());
      }
      return summary;
    })().finally(() => {
      request = undefined;
    });
    return request as Promise<DomainSummary>;
  },
};
