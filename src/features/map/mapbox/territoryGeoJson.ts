import { territoryVisual } from '../mapVisuals';
import type { MapTerritory, TerritoryGeometry } from '../../territories/types';
import type { FeatureCollection } from './geoJsonTypes';

export interface TerritoryDisplayProperties {
  regionId: string; ownerUserId: string | null; status: string; controlPercentage: number;
  myInfluencePoints: number; totalInfluencePoints: number; territoryCount: number;
  renderFillColor: string; renderStrokeColor: string; renderStrokeWidth: number; source: string;
}

export function territoryGeometry(territory: MapTerritory): TerritoryGeometry {
  const polygons = territory.polygons.map(({ outer, holes }) => [outer, ...holes].map(ring => ring.map(({ longitude, latitude }) => [longitude, latitude] as [number, number])));
  return territory.geometryType === 'Polygon' ? { type: 'Polygon', coordinates: polygons[0] ?? [] } : { type: 'MultiPolygon', coordinates: polygons };
}

export function territoryFeatureCollection(regions: readonly MapTerritory[]): FeatureCollection<TerritoryGeometry, TerritoryDisplayProperties> {
  return { type: 'FeatureCollection', features: regions.map(region => {
    const visual = territoryVisual(region);
    return { type: 'Feature', id: region.id, geometry: territoryGeometry(region), properties: { regionId: region.id, ownerUserId: region.ownerUserId, status: region.status, controlPercentage: region.controlPercentage, myInfluencePoints: region.myInfluencePoints, totalInfluencePoints: region.totalInfluencePoints, territoryCount: region.territoryCount, renderFillColor: visual.fillColor, renderStrokeColor: visual.strokeColor, renderStrokeWidth: visual.strokeWidth, source: region.source } };
  }) };
}

export function resolveTerritoryTap(regions: readonly MapTerritory[], regionId: unknown): MapTerritory | undefined {
  return typeof regionId === 'string' ? regions.find(region => region.id === regionId) : undefined;
}

