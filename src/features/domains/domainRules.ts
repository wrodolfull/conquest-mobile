import type {
  ControlledTerritoryCell,
  DomainImpact,
  DomainSummary,
} from "./domainTypes";
export const axialKey = (q: number, r: number) => `${q},${r}`;
export const axialNeighbors = (q: number, r: number) =>
  [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
  ] as const;
export function buildDomainSummary(
  cells: readonly ControlledTerritoryCell[],
): DomainSummary {
  const byCoordinate = new Map(
    cells.map((cell) => [axialKey(cell.q, cell.r), cell]),
  );
  const unseen = new Set(byCoordinate.keys());
  const components: ControlledTerritoryCell[][] = [];
  while (unseen.size) {
    const first = unseen.values().next().value as string;
    const stack = [first];
    unseen.delete(first);
    const component: ControlledTerritoryCell[] = [];
    while (stack.length) {
      const key = stack.pop()!;
      const cell = byCoordinate.get(key)!;
      component.push(cell);
      for (const neighbor of axialNeighbors(cell.q, cell.r)) {
        const next = axialKey(neighbor.q, neighbor.r);
        if (unseen.delete(next)) stack.push(next);
      }
    }
    components.push(component);
  }
  const domains = components
    .map((component) => {
      const territoryIds = component.map((cell) => cell.territoryId).sort();
      return {
        id: territoryIds[0]!,
        territoryIds,
        zoneCount: territoryIds.length,
      };
    })
    .sort((a, b) => b.zoneCount - a.zoneCount || a.id.localeCompare(b.id));
  const territoryDomainIds = new Map<string, string>();
  domains.forEach((domain) =>
    domain.territoryIds.forEach((id) => territoryDomainIds.set(id, domain.id)),
  );
  return {
    domainCount: domains.length,
    largestDomainSize: domains[0]?.zoneCount ?? 0,
    totalControlledZones: cells.length,
    domains,
    cells: [...cells],
    territoryDomainIds,
  };
}
export function domainImpact(
  q: number,
  r: number,
  cells: readonly ControlledTerritoryCell[],
  summary = buildDomainSummary(cells),
): DomainImpact {
  const byCoordinate = new Map(
    cells.map((cell) => [axialKey(cell.q, cell.r), cell]),
  );
  const ids = new Set<string>();
  axialNeighbors(q, r).forEach((n) => {
    const cell = byCoordinate.get(axialKey(n.q, n.r));
    const id = cell && summary.territoryDomainIds.get(cell.territoryId);
    if (id) ids.add(id);
  });
  const sizes = [...ids]
    .map((id) => summary.domains.find((d) => d.id === id)!.zoneCount)
    .sort((a, b) => b - a);
  if (!sizes.length)
    return { kind: "new", adjacentDomainCount: 0, projectedSize: 1 };
  if (sizes.length === 1)
    return {
      kind: "expand",
      adjacentDomainCount: 1,
      currentSize: sizes[0]!,
      projectedSize: sizes[0]! + 1,
    };
  return {
    kind: "connect",
    adjacentDomainCount: sizes.length,
    connectedSizes: sizes,
    projectedSize: sizes.reduce((sum, size) => sum + size, 1),
  };
}
export function isSoleLeader(
  myInfluence: number,
  otherInfluences: readonly number[],
) {
  return (
    myInfluence > 0 && !otherInfluences.some((value) => value >= myInfluence)
  );
}
