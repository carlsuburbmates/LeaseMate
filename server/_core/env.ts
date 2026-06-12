export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // APP_URL is the public base URL of the app (e.g. https://leasemate.com.au or http://localhost:3000).
  // Used for constructing absolute links in emails and webhooks.
  // Falls back to VITE_OAUTH_PORTAL_URL for backwards compatibility with Manus deployments.
  appUrl: process.env.APP_URL ?? process.env.VITE_OAUTH_PORTAL_URL ?? "http://localhost:3000",
};
