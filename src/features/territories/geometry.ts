import type { LatLng } from 'react-native-maps';
export type TerritoryGeometry={type:'Polygon';coordinates:number[][][]}|{type:'MultiPolygon';coordinates:number[][][][]};
export function geometryRings(geometry:TerritoryGeometry):LatLng[][]{const rings=geometry.type==='Polygon'?[geometry.coordinates[0]??[]]:geometry.coordinates.map(p=>p[0]??[]);return rings.map(r=>r.map(([longitude=0,latitude=0])=>({latitude,longitude})));}
