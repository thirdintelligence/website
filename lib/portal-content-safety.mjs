const CLIENT_DOMAINS = Object.freeze({
  bkwatch: "bankruptcywatch.com",
  shaw: "shawsystems.com"
});

const LOCAL_PATH = /\/Users\/|\/home\/|memory\/[A-Z]/;
const SECRET = /PORTAL_SESSION_SECRET|PASSWORD_HASH|scrypt\$/i;
const MEETING_ACCESS = /https?:\/\/|teams\.microsoft\.com|meet\.google\.com|\b(?:meeting id|passcode|pin|phone conference id)\s*:/i;

export function genericContentSafetyIssues(raw) {
  const issues = [];
  if (LOCAL_PATH.test(raw)) issues.push("contains a local filesystem or memory path");
  if (SECRET.test(raw)) issues.push("contains a credential or password-hash marker");
  return issues;
}

export function communicationSafetyIssues(data, tenant) {
  const issues = [];
  const raw = JSON.stringify(data);
  if (MEETING_ACCESS.test(raw)) issues.push("contains a meeting link, URL, or access code");

  const ownDomain = CLIENT_DOMAINS[tenant];
  const foreignDomains = Object.entries(CLIENT_DOMAINS).filter(([key]) => key !== tenant);
  const records = [
    ...(data.emails || []).map((record) => ({ kind: "email", id: record.id, participants: `${record.from || ""} ${record.to || ""}` })),
    ...(data.meetings || []).map((record) => ({ kind: "meeting", id: record.id, participants: (record.attendees || []).join(" ") }))
  ];

  for (const record of records) {
    const participants = record.participants.toLowerCase();
    const includesOwnTenant = ownDomain ? participants.includes(`@${ownDomain}`) : false;
    for (const [foreignTenant, foreignDomain] of foreignDomains) {
      if (participants.includes(`@${foreignDomain}`) && !includesOwnTenant) {
        issues.push(`${record.kind} ${record.id} has ${foreignTenant} participants but no ${tenant} participant`);
      }
    }
  }
  return issues;
}

export const _internal = { CLIENT_DOMAINS, LOCAL_PATH, SECRET, MEETING_ACCESS };
