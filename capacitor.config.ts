import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.reddot.app",
  appName: "Red.Dot",
  webDir: "dist",
  plugins: {
    FirebaseAuthentication: {
      // Native sign-in UI on Android, then we hand the credential to the Firebase JS SDK
      skipNativeAuth: true,
      providers: ["google.com", "phone"],
    },
  },
};

export default config;
