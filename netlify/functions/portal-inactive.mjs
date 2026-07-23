/**
 * Fail-closed response for API paths beneath a planned/inactive tenant route.
 * This prevents a tenant's HTML catch-all from making an inactive API appear
 * successful before its auth/data/runtime gates are activated.
 */
export default async () => new Response(
  JSON.stringify({ error: "inactive_tenant" }),
  {
    status: 404,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  }
);
