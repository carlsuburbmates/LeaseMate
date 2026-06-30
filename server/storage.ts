/**
 * Storage helpers.
 *
 * Preferred production path:
 * - S3-compatible object storage via the AWS SDK (Cloudflare R2, AWS S3, etc.)
 *
 * Local fallback:
 * - Writes to ./uploads and serves files at /local-uploads/:key
 */
import fs from "node:fs";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env.js";

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

  return { key, url: `/local-uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    return getPublicObjectUrl(key) ?? getS3ObjectSignedUrl(key);
  }

  return `/local-uploads/${key}`;
}
