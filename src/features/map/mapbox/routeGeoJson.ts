import { splitRouteAtGaps, type ActivityPoint } from '../../activity/tracking';
import type { FeatureCollection, LineGeometry, PointGeometry, Position } from './geoJsonTypes';
import { TERRITORY_ROUTE_DISPLAY_POINT_BUDGET } from '../mapPerformance';

const position = ({ longitude, latitude }: ActivityPoint): Position => [longitude, latitude];
export function displayRoutePoints(accepted: readonly ActivityPoint[], budget = TERRITORY_ROUTE_DISPLAY_POINT_BUDGET): ActivityPoint[] {
  if (accepted.length <= budget) return [...accepted];
  const safeBudget = Math.max(2, Math.floor(budget));
  const required = new Set<number>([0, accepted.length - 1]);
  accepted.forEach((point, index) => {
    if (point.breakBefore) { required.add(index); if (index > 0) required.add(index - 1); }
  });
  if (required.size < safeBudget) {
    const slots = safeBudget - required.size;
    for (let slot = 1; slot <= slots; slot += 1) {
      required.add(Math.round(slot * (accepted.length - 1) / (slots + 1)));
    }
    for (let index = 1; required.size < safeBudget && index < accepted.length - 1; index += 1) required.add(index);
  }
  return [...required].sort((a, b) => a - b).slice(0, safeBudget).map(index => accepted[index]!);
}
export function routeFeatureCollection(accepted: readonly ActivityPoint[]): FeatureCollection<LineGeometry> {
  const segments = splitRouteAtGaps(displayRoutePoints(accepted)).filter(segment => segment.length > 1).map(segment => segment.map(position));
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
