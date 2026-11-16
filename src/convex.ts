import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error(
    // Local: .env (copy .env.example). EAS builds: set EXPO_PUBLIC_CONVEX_URL
    // per environment (development / preview / production) on expo.dev,
    // see "environment" in eas.json.
    "Missing EXPO_PUBLIC_CONVEX_URL — set it in .env (local) or in the EAS environment for this build profile"
  );
}

export const convex = new ConvexReactClient(convexUrl);
