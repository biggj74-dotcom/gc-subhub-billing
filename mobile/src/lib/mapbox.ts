import Mapbox from '@rnmapbox/maps';

// Missing token is not fatal at import time (unlike supabase.ts) — degrade
// to Mapbox's own "no token" placeholder in MapView rather than crashing
// the whole app before the user even gets to the Tracking screen.
const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (token) {
  Mapbox.setAccessToken(token);
}

export { Mapbox };
