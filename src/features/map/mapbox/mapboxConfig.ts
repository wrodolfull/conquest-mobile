import Mapbox from '@rnmapbox/maps';

const publicToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
export const mapboxStyleURL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim() || Mapbox.StyleURL.Dark;
export const mapboxConfigurationError = publicToken ? null : 'Mapbox is not configured. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN for this build.';

if (publicToken) Mapbox.setAccessToken(publicToken);

