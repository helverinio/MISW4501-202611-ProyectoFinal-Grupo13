import 'dotenv/config';

export default {
  expo: {
    name: "mobile-temp-project",
    slug: "mobile-temp-project",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {},
    web: {
      bundler: "metro",
      output: "static"
    },
    scheme: "mobile-temp-project",
    experiments: {
      typedRoutes: true
    },
    extra: {
      "REACT_APP_HASH_SALT": process.env.REACT_APP_HASH_SALT,
    }
  }
};
