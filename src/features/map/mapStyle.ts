export const conquestMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#14231f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#789088' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1412' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334943' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#193128' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#30413d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#182824' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c3540' }] },
] as const;
