export interface TerritoryTarget {
  territoryId: string;
  territoryName: string;
  q: number;
  r: number;
  createdAt: number;
}
export function coordinatesFromTerritoryId(id: string) {
  const match = /^local-(-?\d+)-(-?\d+)$/.exec(id);
  return match ? { q: Number(match[1]), r: Number(match[2]) } : undefined;
}
export function formatTargetDistance(meters: number) {
  return meters < 1000
    ? `${Math.round(meters / 10) * 10} M AWAY`
    : `${(meters / 1000).toFixed(1)} KM AWAY`;
}
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180,
    dLat = (b.latitude - a.latitude) * rad,
    dLon = (b.longitude - a.longitude) * rad,
    x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.latitude * rad) *
        Math.cos(b.latitude * rad) *
        Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
