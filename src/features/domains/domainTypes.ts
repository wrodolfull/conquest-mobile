export interface ControlledTerritoryCell {
  territoryId: string;
  name: string;
  q: number;
  r: number;
}
export interface Domain {
  id: string;
  territoryIds: string[];
  zoneCount: number;
}
export interface DomainSummary {
  domainCount: number;
  largestDomainSize: number;
  totalControlledZones: number;
  domains: Domain[];
  cells: ControlledTerritoryCell[];
  territoryDomainIds: ReadonlyMap<string, string>;
}
export type DomainImpact =
  | { kind: "new"; adjacentDomainCount: 0; projectedSize: 1 }
  | {
      kind: "expand";
      adjacentDomainCount: 1;
      currentSize: number;
      projectedSize: number;
    }
  | {
      kind: "connect";
      adjacentDomainCount: number;
      connectedSizes: number[];
      projectedSize: number;
    };
