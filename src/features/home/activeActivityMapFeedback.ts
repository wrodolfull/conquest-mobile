import { INFLUENCE_METERS_PER_POINT } from '../activity/outdoorRules';
import { routeDistanceMeters, segmentDistanceMeters, type ActivityPoint } from '../activity/tracking';
import { territoryAt, type TerritoryCell } from '../territories/territoryGrid';
import type { FeatureCollection, PointGeometry } from '../map/mapbox/geoJsonTypes';

/** Local, private feedback only. None of this data is an ownership assertion. */
export function potentialInfluence(points: readonly ActivityPoint[]): number {
  return potentialInfluenceForDistance(routeDistanceMeters(points));
}

export const potentialInfluenceForDistance = (distanceMeters: number): number =>
  Math.floor(Math.max(0, distanceMeters) / INFLUENCE_METERS_PER_POINT);

export function provisionalTerritoryCells(points: readonly ActivityPoint[]): TerritoryCell[] {
  const cells = new Map<string, TerritoryCell>();
  const add = (latitude: number, longitude: number) => {
    const cell = territoryAt({ latitude, longitude });
    cells.set(cell.id, cell);
  };

  points.forEach((point, index) => {
    add(point.latitude, point.longitude);
    if (index === 0 || point.breakBefore) return;
    const previous = points[index - 1]!;
    const pieces = Math.max(1, Math.ceil(segmentDistanceMeters(previous, point) / 20));
    for (let piece = 0; piece < pieces; piece += 1) {
      const ratio = (piece + 0.5) / pieces;
      add(
        previous.latitude + (point.latitude - previous.latitude) * ratio,
        previous.longitude + (point.longitude - previous.longitude) * ratio,
      );
    }
  });
  return [...cells.values()];
}

/**
 * Cell centers are intentionally rendered as overlapping, blurred map circles.
 * This preserves the atomic gameplay calculation without exposing a hex board.
 */
export function provisionalTerritoryFeatureCollection(points: readonly ActivityPoint[]): FeatureCollection<PointGeometry, { provisional: true }> {
  return {
    type: 'FeatureCollection',
    features: provisionalTerritoryCells(points).map((cell) => ({
      type: 'Feature',
      id: cell.id,
      properties: { provisional: true },
      geometry: {
        type: 'Point',
        coordinates: [cell.center.longitude, cell.center.latitude],
      },
    })),
  };
}
