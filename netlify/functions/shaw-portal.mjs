/* Shaw Systems client portal — placeholder
   Will follow the same architecture as bkwatch-portal.mjs:
   - Scrypt password auth via lib/portal-auth.mjs
   - AES-256-GCM encrypted session cookie
   - Protected HTML shell + client manifest
   - Shaw brand color: #216F9B */

export default async (req) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shaw Systems — Third i Portal</title>
  <link rel="icon" type="image/png" href="/public/images/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Inter, ui-sans-serif, -apple-system, sans-serif;
      background: #0d1b2a;
      color: #e0e6ed;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container { max-width: 500px; padding: 2rem; }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #216F9B;
      margin-bottom: 1rem;
    }
    p { font-size: 1.125rem; line-height: 1.6; color: #8899aa; margin-bottom: 1.5rem; }
    a {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #216F9B;
      color: #000;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    a:hover { background: #0e141c; color: #fff; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(33, 111, 155, 0.15);
      border: 1px solid rgba(33, 111, 155, 0.3);
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #216F9B;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">COMING SOON</div>
    <h1>Shaw Systems</h1>
    <p>Your client portal is being prepared. Check back soon for project updates, film demos, and deliverables.</p>
    <a href="/">Back to Third i</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};
