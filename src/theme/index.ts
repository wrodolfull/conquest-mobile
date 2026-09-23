export const colors = {
  background: '#07100E',
  surface: '#101B18',
  surfaceRaised: '#172521',
  elevatedSurface: '#172521',
  mapOverlay: '#0B1714E8',
  border: '#263832',
  text: '#F1F6F3',
  muted: '#899A94',
  mutedText: '#899A94',
  lime: '#C8FF4A',
  primary: '#C8FF4A',
  primaryMuted: '#526B2C',
  cyan: '#37D8D1',
  gold: '#F8C14C',
  violet: '#A977FF',
  danger: '#FF6B5E',
  success: '#69D391',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { small: 8, medium: 14, large: 20, pill: 999 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '900' as const },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '900' as const },
  heading: { fontSize: 16, lineHeight: 21, fontWeight: '800' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const },
  label: { fontSize: 10, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 0.8 },
  stat: { fontSize: 18, lineHeight: 22, fontWeight: '900' as const },
} as const;
