import Mapbox from '@rnmapbox/maps';

const publicToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
export const mapboxStyleURL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim() || Mapbox.StyleURL.Dark;
export const usesBuiltInMapboxStyle = !process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim();
export const mapboxConfigurationError = publicToken ? null : 'The map is unavailable in this build. Your recorded activity data remains safe.';

if (publicToken) Mapbox.setAccessToken(publicToken);
