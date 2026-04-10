import 'dotenv/config';

export default {
  expo: {
    name: "travel-hub",
    slug: "travel-hub",
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
    android: {
      package: "com.travelhub.app"
    },
    web: {
      bundler: "metro",
      output: "static"
    },
    scheme: "travel-hub",
    experiments: {
      typedRoutes: true
    },
    extra: {
      "REACT_APP_HASH_SALT": process.env.REACT_APP_HASH_SALT,
      eas: {
        projectId: "fefd16b7-4a5a-4e76-82ca-36ea963e82d4"
      }
    }
  }
};
