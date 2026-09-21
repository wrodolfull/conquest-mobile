export interface LatLng { latitude: number; longitude: number }
export type Position = [longitude: number, latitude: number];
export interface Feature<G, P = Record<string, string | number | boolean | null>> { type: 'Feature'; id?: string; geometry: G; properties: P }
export interface FeatureCollection<G, P = Record<string, string | number | boolean | null>> { type: 'FeatureCollection'; features: Feature<G, P>[] }
export interface PointGeometry { type: 'Point'; coordinates: Position }
export interface LineGeometry { type: 'LineString' | 'MultiLineString'; coordinates: Position[] | Position[][] }
export interface PolygonGeometry { type: 'Polygon'; coordinates: Position[][] }
