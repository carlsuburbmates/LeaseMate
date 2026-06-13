/**
 * Storage helpers.
 *
 * Preferred production path:
 * - S3-compatible object storage via the AWS SDK (Cloudflare R2, AWS S3, etc.)
 *
 * Legacy compatibility path:
 * - Manus Forge presign API when Forge storage env vars are present
 *
 * Local fallback:
 * - Writes to ./uploads and serves files at /local-uploads/:key
 */
import fs from "node:fs";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const STORAGE_ROUTE_PREFIX = "/storage";

let _s3Client: S3Client | null = null;

function isS3Configured(): boolean {
  return Boolean(
    ENV.storageBucket &&
      ENV.storageAccessKeyId &&
      ENV.storageSecretAccessKey
  );
}

function isForgeConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function getS3Client() {
  if (!isS3Configured()) {
    throw new Error(
      "S3 storage config missing: set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY"
    );
  }

  if (!ENV.storageEndpoint && ENV.storageRegion === "auto") {
    throw new Error(
      "S3 storage config incomplete: set S3_ENDPOINT for R2-style storage or change S3_REGION for AWS S3"
    );
  }

  if (_s3Client) return _s3Client;

  _s3Client = new S3Client({
    region: ENV.storageRegion,
    endpoint: ENV.storageEndpoint || undefined,
    forcePathStyle: ENV.storageForcePathStyle,
    credentials: {
      accessKeyId: ENV.storageAccessKeyId,
      secretAccessKey: ENV.storageSecretAccessKey,
    },
  });

  return _s3Client;
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function ensureLocalUploadsDir() {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function getStorageRoute(key: string) {
  return `${STORAGE_ROUTE_PREFIX}/${key}`;
}

function getPublicObjectUrl(key: string) {
  if (!ENV.storagePublicBaseUrl) return null;
  const base = ENV.storagePublicBaseUrl.replace(/\/+$/, "");
  return `${base}/${key}`;
}

async function putToS3(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.storageBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: getPublicObjectUrl(key) ?? getStorageRoute(key),
  };
}

async function getS3ObjectSignedUrl(key: string): Promise<string> {
  const client = getS3Client();
  return getS3SignedUrl(
    client,
    new GetObjectCommand({
      Bucket: ENV.storageBucket,
      Key: key,
    }),
    { expiresIn: 60 * 60 }
  );
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (isS3Configured()) {
    return putToS3(key, data, contentType);
  }

  if (isForgeConfigured()) {
    const { forgeUrl, forgeKey } = getForgeConfig();

    const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
    presignUrl.searchParams.set("path", key);

    const presignResp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });

    if (!presignResp.ok) {
      const msg = await presignResp.text().catch(() => presignResp.statusText);
      throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
    }

    const { url: s3Url } = (await presignResp.json()) as { url: string };
    if (!s3Url) throw new Error("Forge returned empty presign URL");

    const blob =
      typeof data === "string"
        ? new Blob([data], { type: contentType })
        : new Blob([data as any], { type: contentType });

    const uploadResp = await fetch(s3Url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!uploadResp.ok) {
      throw new Error(`Storage upload to Forge-backed object store failed (${uploadResp.status})`);
    }

    return { key, url: `/manus-storage/${key}` };
  }

  ensureLocalUploadsDir();
  const filePath = path.join(LOCAL_UPLOADS_DIR, key.replace(/\//g, "_"));
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  fs.writeFileSync(filePath, buffer);
  console.log(`[Storage] Local fallback: saved ${key} to ${filePath}`);
  return { key, url: `/local-uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    return {
      key,
      url: getPublicObjectUrl(key) ?? getStorageRoute(key),
    };
  }

  if (isForgeConfigured()) {
    return { key, url: `/manus-storage/${key}` };
  }

  return { key, url: `/local-uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    return getPublicObjectUrl(key) ?? getS3ObjectSignedUrl(key);
  }

  if (isForgeConfigured()) {
    const { forgeUrl, forgeKey } = getForgeConfig();

    const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
    getUrl.searchParams.set("path", key);

    const resp = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
    }

    const { url } = (await resp.json()) as { url: string };
    return url;
  }

  return `/local-uploads/${key}`;
}
