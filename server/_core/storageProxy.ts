import type { Express, Request, Response } from "express";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./env";

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
    throw new Error("S3 storage proxy not configured");
  }

  if (!ENV.storageEndpoint && ENV.storageRegion === "auto") {
    throw new Error(
      "S3 storage proxy config incomplete: set S3_ENDPOINT for R2-style storage or change S3_REGION for AWS S3"
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

async function handleStorageRedirect(req: Request, res: Response) {
  const key = (req.params as Record<string, string>)[0];
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  if (isS3Configured()) {
    try {
      if (ENV.storagePublicBaseUrl) {
        const base = ENV.storagePublicBaseUrl.replace(/\/+$/, "");
        res.set("Cache-Control", "public, max-age=300");
        res.redirect(307, `${base}/${key}`);
        return;
      }

      const signedUrl = await getS3SignedUrl(
        getS3Client(),
        new GetObjectCommand({
          Bucket: ENV.storageBucket,
          Key: key,
        }),
        { expiresIn: 60 * 60 }
      );

      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl);
      return;
    } catch (err) {
      console.error("[StorageProxy] S3 redirect failed:", err);
      res.status(502).send("Object storage backend error");
      return;
    }
  }

  res.status(500).send("Storage proxy not configured");
}

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", handleStorageRedirect);
}
