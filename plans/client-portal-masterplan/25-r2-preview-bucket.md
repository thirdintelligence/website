# Cloudflare R2 preview bucket

Status: user setup required
Updated: 2026-07-22

Production and deploy previews currently point at the same media bucket. Create a separate preview bucket before testing client media in preview deployments.

## Five-minute setup

1. In Cloudflare, open **R2 Object Storage** and choose **Create bucket**.
2. Name it exactly `thirdi-media-preview`. Use the default/nearest location.
3. In **R2 API Tokens**, create an object read/write token scoped only to `thirdi-media-preview`.
4. In Netlify, open the Third i site's environment variables and set the deploy-preview context to:
   - `PORTAL_MEDIA_R2_BUCKET=thirdi-media-preview`
   - the preview bucket's scoped access key and secret
   - `PORTAL_DATA_STORE_VERSION=portal-live-preview-v1`
   - preview/local origins only in `PORTAL_MEDIA_ALLOWED_ORIGINS`
5. Leave production bucket, credentials, and store version unchanged. Redeploy a preview and test upload, review, approval, download, and wrong-tenant denial.

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
