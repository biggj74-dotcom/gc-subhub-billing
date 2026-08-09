// Dynamic config (JS) instead of static app.json — needed so the Mapbox
// plugin below can read a secret build-time token from process.env, which
// a plain JSON file can't do. Expo CLI loads .env into process.env before
// evaluating this file, same as it does for app.json normally.
module.exports = {
  expo: {
    name: 'GCSubHub Trucking',
    slug: 'gcsubhub-trucking',
    scheme: 'gcsubhub-trucking',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0B0C10',
    ios: {
      supportsTablet: true,
      // Required once app.config.js (dynamic config) is in play — Expo
      // can't auto-write a missing identifier into a JS file the way it
      // could into app.json, so prebuild fails without this set explicitly.
      bundleIdentifier: 'com.gcsubhub.trucking',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.gcsubhub.trucking',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'GCSubHub Trucking uses your location to log check-ins on your active load.',
        },
      ],
      // No config props here on purpose — @rnmapbox/maps deprecated the
      // RNMapboxMapsDownloadToken plugin prop (it wrote the secret token
      // straight into android/gradle.properties, a bad place for it to
      // live). The download token is now read directly from the
      // RNMAPBOX_MAPS_DOWNLOAD_TOKEN environment variable by Mapbox's own
      // native build scripts instead — see README "Map setup (Mapbox)".
      '@rnmapbox/maps',
    ],
  },
};
