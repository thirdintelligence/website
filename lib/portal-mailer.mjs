/**
 * portal-mailer.mjs — provider-agnostic outbound mail.
 *   PORTAL_MAIL_PROVIDER=log     → dev: logs, never sends (default)
 *   PORTAL_MAIL_PROVIDER=resend  → prod: Resend HTTP API (needs PORTAL_MAIL_API_KEY)
 * Swapping providers is a single adapter here; callers are unchanged.
 */
export async function sendMail({ to, subject, text }, { fetchImpl = fetch } = {}) {
  const provider = process.env.PORTAL_MAIL_PROVIDER || (process.env.CONTEXT === "production" ? "unconfigured" : "log");
  const from = process.env.PORTAL_MAIL_FROM || "portal@thirdi.net";

  if (provider === "log") {
    console.log(`[mail:log] from=${from} to=${to} subject=${JSON.stringify(subject)}`);
    return { ok: true, provider: "log" };
  }
  if (provider === "resend") {
    const apiKey = process.env.PORTAL_MAIL_API_KEY;
    if (!apiKey) return { ok: false, error: "mail_not_configured" };
    try {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to, subject, text })
      });
      if (!res.ok) return { ok: false, error: `resend_${res.status}` };
      return { ok: true, provider: "resend" };
    } catch (e) { return { ok: false, error: "network_" + (e.code || "error") }; }
  }
  return { ok: false, error: "unknown_provider" };
}
