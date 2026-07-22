import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSchemaRegistry, getContentValidator } from "../../lib/portal-schemas.mjs";
import { render } from "../../public/portal/pages/value-results.js";

const ROOT = resolve(import.meta.dirname, "..", "..");
const read = async (tenant) => JSON.parse(await readFile(resolve(ROOT, "content", "clients", tenant, "invoicing.json"), "utf8"));
const portal = (name, shortName) => ({ client: { name, shortName } });

test("bkWatch value page gates its live graph and exposes no Shaw production evidence", async () => {
  const invoicing = await read("bkwatch");
  const { html } = render({ invoicing, portal: portal("BankruptcyWatch", "bkWatch"), aiRoadmap: null });

  assert.match(html, /class="efficiency-readiness" data-completed-projects="0" data-required-projects="2"/);
  assert.doesNotMatch(html, /class="efficiency-chart"/);
  assert.doesNotMatch(html, /Shaw Systems|Amplify|614 hours|250 hours/i);
  assert.match(html, /Built on prior work\. Isolated by client\./);
  assert.equal((html.match(/class="future-value-item"/g) || []).length, 6);
  assert.equal((html.match(/class="cap-row"/g) || []).length, 16);
  assert.doesNotMatch(html, /Financial summary|financial-metric|>Outcomes<|outcome-list|Future value record/);

  const momentumStart = html.indexOf('<section class="section momentum-section">');
  const momentum = html.slice(momentumStart, html.indexOf("</section>", momentumStart));
  assert.ok(momentumStart >= 0, "Momentum section renders");
  assert.equal((momentum.match(/class="future-value-item"/g) || []).length, 6);
  assert.ok(momentum.indexOf('class="future-value-grid"') > momentum.indexOf('class="metric-grid"'));

  assert.equal(invoicing.metrics.deliverablesCompleted.descriptor, "deliverables");
  assert.match(invoicing.metrics.deliverablesCompleted.label, /4 of 8 Film 1 - Shaw Integration deliverables are ready/);
  assert.equal(invoicing.metrics.hoursInvested.descriptor, "hours");
  assert.equal(invoicing.metrics.capabilitiesDelivered.descriptor, "capabilities");
  assert.equal(invoicing.outcomes, undefined);
  assert.equal(invoicing.capabilities.some((capability) => capability.title === "Monthly Video Series"), false);
  assert.match(invoicing.capabilities.find((capability) => capability.title === "AI Film Production").description, /ongoing monthly film series/i);
});

test("Shaw value page activates the expected-vs-actual graph from two approved films", async () => {
  const invoicing = await read("shaw");
  const ajv = await createSchemaRegistry();
  const validate = getContentValidator(ajv, "invoicing.json");
  assert.ok(validate(invoicing), JSON.stringify(validate.errors));

  const { html } = render({ invoicing, portal: portal("Shaw Systems", "Shaw"), aiRoadmap: null });
  const graph = html.slice(html.indexOf('<div class="efficiency-live"'), html.indexOf('<section class="section">'));
  assert.match(graph, /class="efficiency-chart"/);
  assert.match(graph, />150 h\/min</);
  assert.match(graph, />120 h\/min</);
  assert.match(graph, /Future Shaw films/);
  assert.match(graph, /In development/);
  assert.doesNotMatch(html, /Financial summary|>Outcomes<|Future value record/);

  const parsePoints = (klass) => graph.match(new RegExp(`class="eff-line ${klass}" points="([^"]+)"`))[1]
    .split(" ").map((point) => point.split(",").map(Number));
  const actual = parsePoints("actual");
  const expected = parsePoints("expected");
  assert.ok(actual[1][1] < actual[0][1], "actual efficiency rises over time");
  assert.ok(expected[1][1] < expected[0][1], "expected efficiency rises over time");
  assert.ok(expected[0][1] > actual[0][1] && expected[1][1] > actual[1][1], "actual stays above expected efficiency");
});
