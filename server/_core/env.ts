export const ENV = {
  get cookieSecret() {
    return process.env.JWT_SECRET ?? "";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get ownerEmail() {
    return process.env.OWNER_EMAIL ?? "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get resendFromAddress() {
    return process.env.RESEND_FROM_ADDRESS ?? "LeaseMate <onboarding@resend.dev>";
  },
  get resendReplyTo() {
    return process.env.RESEND_REPLY_TO ?? "support@leasemate.com.au";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get internalJobSecret() {
    return (
      process.env.INTERNAL_JOB_SECRET ??
      process.env.CRON_SECRET ??
      process.env.JWT_SECRET ??
      ""
    );
  },
  get qstashToken() {
    return process.env.QSTASH_TOKEN ?? "";
  },
  get qstashCurrentSigningKey() {
    return process.env.QSTASH_CURRENT_SIGNING_KEY ?? "";
  },
  get qstashNextSigningKey() {
    return process.env.QSTASH_NEXT_SIGNING_KEY ?? "";
  },
  get storageBucket() {
    return process.env.S3_BUCKET ?? "";
  },
  get storageRegion() {
    return process.env.S3_REGION ?? "auto";
  },
  get storageEndpoint() {
    return process.env.S3_ENDPOINT ?? "";
  },
  get storageAccessKeyId() {
    return process.env.S3_ACCESS_KEY_ID ?? "";
  },
  get storageSecretAccessKey() {
    return process.env.S3_SECRET_ACCESS_KEY ?? "";
  },
  get storagePublicBaseUrl() {
    return process.env.S3_PUBLIC_BASE_URL ?? "";
  },
  get storageForcePathStyle() {
    return process.env.S3_FORCE_PATH_STYLE === "true";
  },
  // APP_URL is the public base URL of the app (e.g. https://leasemate.com.au or http://localhost:3000).
  // Used for constructing absolute links in emails and webhooks.
  get appUrl() {
    return process.env.APP_URL ?? "http://localhost:3000";
  },
};
