export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  internalJobSecret:
    process.env.INTERNAL_JOB_SECRET ??
    process.env.CRON_SECRET ??
    process.env.JWT_SECRET ??
    "",
  authMode:
    (process.env.AUTH_MODE ??
      process.env.VITE_AUTH_MODE ??
      (process.env.OAUTH_SERVER_URL ? "manus" : "local")) === "manus"
      ? "manus"
      : "local",
  qstashToken: process.env.QSTASH_TOKEN ?? "",
  qstashCurrentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
  qstashNextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
  storageBucket: process.env.S3_BUCKET ?? "",
  storageRegion: process.env.S3_REGION ?? "auto",
  storageEndpoint: process.env.S3_ENDPOINT ?? "",
  storageAccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  storageSecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  storagePublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
  storageForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  // APP_URL is the public base URL of the app (e.g. https://leasemate.com.au or http://localhost:3000).
  // Used for constructing absolute links in emails and webhooks.
  // Falls back to VITE_OAUTH_PORTAL_URL for backwards compatibility with Manus deployments.
  appUrl: process.env.APP_URL ?? process.env.VITE_OAUTH_PORTAL_URL ?? "http://localhost:3000",
};
