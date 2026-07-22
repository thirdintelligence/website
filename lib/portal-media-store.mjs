/* portal-media-store.mjs — Cloudflare R2 (S3-compatible) media abstraction.
   Netlify only validates + signs; the 1–2 GiB bytes go directly browser↔R2.
   Without credentials configured (dev/tests) every call returns
   {ok:false,error:"media_not_configured"} so nothing crashes. */
import { PART_TTL, DOWNLOAD_TTL } from "./portal-media-policy.mjs";

export function configured() {
  return !!(process.env.PORTAL_MEDIA_R2_ACCOUNT_ID && process.env.PORTAL_MEDIA_R2_BUCKET &&
            process.env.PORTAL_MEDIA_R2_ACCESS_KEY_ID && process.env.PORTAL_MEDIA_R2_SECRET_ACCESS_KEY);
}

let _client = null;
async function client() {
  if (_client) return _client;
  const { S3Client } = await import("@aws-sdk/client-s3");
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.PORTAL_MEDIA_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.PORTAL_MEDIA_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.PORTAL_MEDIA_R2_SECRET_ACCESS_KEY
    }
  });
  return _client;
}
const bucket = () => process.env.PORTAL_MEDIA_R2_BUCKET;
const notConfigured = { ok: false, error: "media_not_configured" };

export async function createMultipart(key, contentType) {
  if (!configured()) return notConfigured;
  const { CreateMultipartUploadCommand } = await import("@aws-sdk/client-s3");
  const c = await client();
  const res = await c.send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: contentType }));
  return { ok: true, uploadId: res.UploadId };
}

export async function signPart(key, uploadId, partNumber) {
  if (!configured()) return notConfigured;
  const { UploadPartCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const url = await getSignedUrl(await client(), new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn: PART_TTL });
  return { ok: true, url };
}

export async function completeMultipart(key, uploadId, parts) {
  if (!configured()) return notConfigured;
  const { CompleteMultipartUploadCommand } = await import("@aws-sdk/client-s3");
  await (await client()).send(new CompleteMultipartUploadCommand({
    Bucket: bucket(), Key: key, UploadId: uploadId,
    MultipartUpload: { Parts: parts.map((p) => ({ ETag: p.etag, PartNumber: p.partNumber })) }
  }));
  return { ok: true };
}

export async function abortMultipart(key, uploadId) {
  if (!configured()) return notConfigured;
  const { AbortMultipartUploadCommand } = await import("@aws-sdk/client-s3");
  await (await client()).send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId }));
  return { ok: true };
}

export async function verifyObject(key, expected = {}) {
  if (!configured()) return notConfigured;
  const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
  try {
    const result = await (await client()).send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    if (Number.isFinite(expected.sizeBytes) && Number(result.ContentLength) !== Number(expected.sizeBytes)) return { ok: false, error: "size_mismatch" };
    if (expected.contentType && result.ContentType && result.ContentType !== expected.contentType) return { ok: false, error: "type_mismatch" };
    return { ok: true, etag: result.ETag, sizeBytes: result.ContentLength, contentType: result.ContentType };
  } catch { return { ok: false, error: "object_not_found" }; }
}

export async function deleteObject(key) {
  if (!configured()) return notConfigured;
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await (await client()).send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  return { ok: true };
}

export async function signSinglePut(key, contentType) {
  if (!configured()) return notConfigured;
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const url = await getSignedUrl(await client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: PART_TTL });
  return { ok: true, url };
}

export async function signDownload(key, { filename, expiresIn = DOWNLOAD_TTL } = {}) {
  if (!configured()) return notConfigured;
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const url = await getSignedUrl(await client(), new GetObjectCommand({
    Bucket: bucket(), Key: key,
    ResponseContentDisposition: filename ? `attachment; filename="${filename}"` : undefined
  }), { expiresIn });
  return { ok: true, url };
}

export async function signPlayback(key, { contentType, expiresIn = DOWNLOAD_TTL } = {}) {
  if (!configured()) return notConfigured;
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const url = await getSignedUrl(await client(), new GetObjectCommand({
    Bucket: bucket(), Key: key,
    ResponseContentType: contentType || undefined,
    ResponseContentDisposition: "inline"
  }), { expiresIn });
  return { ok: true, url };
}
