export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  internalJobSecret:
    process.env.INTERNAL_JOB_SECRET ??
    process.env.CRON_SECRET ??
    process.env.JWT_SECRET ??
    "",
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
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
