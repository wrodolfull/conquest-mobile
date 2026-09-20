import { splitRouteAtGaps, type ActivityPoint } from '../../activity/tracking';
import type { FeatureCollection, LineGeometry, PointGeometry, Position } from './geoJsonTypes';

const position = ({ longitude, latitude }: ActivityPoint): Position => [longitude, latitude];
export function routeFeatureCollection(accepted: readonly ActivityPoint[]): FeatureCollection<LineGeometry> {
  const segments = splitRouteAtGaps(accepted).filter(segment => segment.length > 1).map(segment => segment.map(position));
  const geometry: LineGeometry = segments.length <= 1 ? { type: 'LineString', coordinates: segments[0] ?? [] } : { type: 'MultiLineString', coordinates: segments };
  return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry, properties: {} }] };
}
export function pointFeatureCollection(points: readonly ActivityPoint[]): FeatureCollection<PointGeometry, { role: string }> {
  return { type: 'FeatureCollection', features: points.map((point, index) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: position(point) }, properties: { role: index === 0 ? 'start' : 'finish' } })) };
}
export function routeBounds(points: readonly ActivityPoint[]): { northEast: Position; southWest: Position } | null {
  if (!points.length) return null;
  return { northEast: [Math.max(...points.map(p => p.longitude)), Math.max(...points.map(p => p.latitude))], southWest: [Math.min(...points.map(p => p.longitude)), Math.min(...points.map(p => p.latitude))] };
}

