import { INFLUENCE_METERS_PER_POINT } from '../activity/outdoorRules';
import { routeDistanceMeters, segmentDistanceMeters, type ActivityPoint } from '../activity/tracking';
import { territoryAt, type TerritoryCell } from '../territories/territoryGrid';
import type { FeatureCollection, PolygonGeometry } from '../map/mapbox/geoJsonTypes';

export interface ProvisionalZoneImpact { cell: TerritoryCell; distanceMeters: number; influenceEarned: number }

/** Local, private feedback only. None of this data is an ownership assertion. */
export function potentialInfluence(points: readonly ActivityPoint[]): number {
  return potentialInfluenceForDistance(routeDistanceMeters(points));
}

export const potentialInfluenceForDistance = (distanceMeters: number): number =>
  Math.floor(Math.max(0, distanceMeters) / INFLUENCE_METERS_PER_POINT);

export function provisionalTerritoryCells(points: readonly ActivityPoint[]): TerritoryCell[] {
  return provisionalZoneImpacts(points).map(({ cell }) => cell);
}

/** Mirrors the server's 20 metre traversal and global-remainder allocation for UI estimates only. */
export function provisionalZoneImpacts(points: readonly ActivityPoint[]): ProvisionalZoneImpact[] {
  const impacts = new Map<string, { cell: TerritoryCell; distanceMeters: number }>();
  points.forEach((point, index) => {
    if (index === 0 || point.breakBefore) return;
    const previous = points[index - 1]!;
    const segment = segmentDistanceMeters(previous, point);
    const pieces = Math.max(1, Math.ceil(segment / 20));
    for (let piece = 0; piece < pieces; piece += 1) {
      const ratio = (piece + 0.5) / pieces;
      const cell = territoryAt({ latitude: previous.latitude + (point.latitude - previous.latitude) * ratio, longitude: previous.longitude + (point.longitude - previous.longitude) * ratio });
      const current = impacts.get(cell.id) ?? { cell, distanceMeters: 0 };
      current.distanceMeters += segment / pieces;
      impacts.set(cell.id, current);
    }
  });
  const result = [...impacts.values()].map((impact) => ({ ...impact, influenceEarned: Math.floor(impact.distanceMeters / INFLUENCE_METERS_PER_POINT) }));
  let remainder = potentialInfluence(points) - result.reduce((sum, impact) => sum + impact.influenceEarned, 0);
  for (const impact of [...result].sort((a, b) => (b.distanceMeters % INFLUENCE_METERS_PER_POINT) - (a.distanceMeters % INFLUENCE_METERS_PER_POINT) || a.cell.id.localeCompare(b.cell.id))) {
    if (remainder <= 0) break;
    impact.influenceEarned += 1;
    remainder -= 1;
  }
  return result;
}

/**
 * Actual traversed polygons keep influence aligned with the route. The renderer
 * softens shared edges rather than drawing a permanent grid.
 */
export function provisionalTerritoryFeatureCollection(points: readonly ActivityPoint[]): FeatureCollection<PolygonGeometry, { provisional: true; zoneId: string; influence: number }> {
  return {
    type: 'FeatureCollection',
    features: provisionalZoneImpacts(points).map(({ cell, influenceEarned }) => ({
      type: 'Feature',
      id: cell.id,
      properties: { provisional: true, zoneId: cell.id, influence: influenceEarned },
      geometry: {
        type: 'Polygon',
        coordinates: [[...cell.boundary, cell.boundary[0]!].map(({ longitude, latitude }) => [longitude, latitude])],
      },
    })),
  };
}

/** Exploration signal only; it grants no reward and makes no ownership claim. */
export function firstTimeInfluencedZoneIds(impacts: readonly ProvisionalZoneImpact[], previouslyInfluencedZoneIds: ReadonlySet<string>): string[] {
  return impacts.filter(({ cell, influenceEarned }) => influenceEarned > 0 && !previouslyInfluencedZoneIds.has(cell.id)).map(({ cell }) => cell.id);
}
