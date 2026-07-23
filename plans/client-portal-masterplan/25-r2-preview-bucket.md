# Cloudflare R2 preview bucket

Status: bucket/non-secret Netlify separation complete; preview token and R2 CORS require Cloudflare setup
Updated: 2026-07-23

Production and deploy previews now use different bucket names and operational store versions. Production values were not changed.

## Configured now

- Cloudflare bucket: `thirdi-media-preview`
- Netlify deploy-preview `PORTAL_MEDIA_R2_BUCKET=thirdi-media-preview`
- Netlify deploy-preview `PORTAL_DATA_STORE_VERSION=portal-live-preview-v1`
- Netlify deploy-preview `PORTAL_MEDIA_ALLOWED_ORIGINS=https://portal-preview--thirdintelligence.netlify.app,http://localhost:8888,http://127.0.0.1:8888`
- `PORTAL_MEDIA_R2_ACCOUNT_ID` may remain the same account ID in production and preview.
- Application code now enforces the configured media-origin allowlist before signing media requests.

## Remaining Cloudflare steps

1. Open Cloudflare → **R2 Object Storage** → **Manage R2 API Tokens**.
2. Create a token named `Third i portal media — deploy preview`.
3. Choose **Object Read & Write** and scope it to **only** `thirdi-media-preview`. Do not choose all buckets or Admin Read & Write.
4. Create the token. Copy both values immediately:
   - **Access Key ID** (sometimes shown as Client ID)
   - **Secret Access Key** (sometimes shown as Client Secret; visible only once)
5. In Netlify → Third i project → Environment variables:
   - edit `PORTAL_MEDIA_R2_ACCESS_KEY_ID`;
   - add a **deploy-preview** value using the new preview Access Key ID;
   - edit `PORTAL_MEDIA_R2_SECRET_ACCESS_KEY`;
   - add a **deploy-preview** secret value using the new preview Secret Access Key;
   - keep each variable available to Functions/runtime;
   - leave the production values unchanged.
6. Do not paste either credential into chat, Git, memory, `os.html`, or a shell command.

Cloudflare documents that Object Read & Write tokens can be restricted to selected buckets, and that the Secret Access Key cannot be viewed again after creation: <https://developers.cloudflare.com/r2/api/tokens/>.

## R2 CORS rule

Presigned URLs authenticate the request, but the browser still requires an exact bucket CORS rule. In `thirdi-media-preview` → Settings → CORS policy, use:

```json
[
  {
    "AllowedOrigins": [
      "https://portal-preview--thirdintelligence.netlify.app",
      "http://localhost:8888",
      "http://127.0.0.1:8888"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Range",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-security-token"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

Cloudflare requires origins to match exactly and to contain only `scheme://host[:port]`: <https://developers.cloudflare.com/r2/buckets/cors/>.

Use the stable preview alias `portal-preview--thirdintelligence.netlify.app` for media testing. Ordinary numbered PR deploy-preview URLs are intentionally not covered; add an exact origin temporarily if one must test media, then remove it.

## Preview verification

1. Deploy a stable preview with `netlify deploy --alias portal-preview`.
2. Confirm the preview resolves:
   - the preview bucket;
   - the preview Access Key ID/Secret Access Key;
   - `portal-live-preview-v1`;
   - only the stable preview/local origins above.
3. Test a small upload first, then multipart upload, owner approval, playback/download, and interrupted upload resume.
4. Confirm the uploaded object appears only in `thirdi-media-preview`.
5. Confirm production cannot read the preview object and preview cannot read production objects.
6. Confirm an unapproved asset and a wrong-tenant request are denied.

## Simple current media policy

- Production and preview never share a bucket or credential.
- Uploads are private and tenant-prefixed.
- Client uploads remain pending until owner approval.
- Only approved media can be viewed/downloaded by a client.
- Keep the existing 2 GiB owner upload and 512 MiB client upload limits for now.
- Keep the existing allowed file types; do not allow active web files such as HTML, SVG, JavaScript, or XML.
- Keep signed URLs short-lived and do not expose bucket credentials to the browser.
- Retention, quarantine/scanning, and paid budget alerts stay simple and are added only when real client upload volume or provider requirements justify them.

## Acceptance check

- Netlify production and deploy-preview bucket names differ.
- Netlify production and deploy-preview operational store versions differ.
- A preview upload never appears in the production portal.
- An unapproved client upload cannot be played/downloaded.
- Cross-tenant access returns a denial.
