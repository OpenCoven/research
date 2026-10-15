import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const researchRunner = readFileSync(new URL("../src/lib/server/research-mission-runner.ts", import.meta.url), "utf8");

assert.match(
  researchRunner,
  /startFlowSession\(flow, \{\s*projectRoot: options\.projectRoot,\s*addDirs: options\.addDirs,\s*trustedLocalResearch: true,\s*offlinePolicy: options\.offlinePolicy,[\s\S]*?publishSessionOwner: options\.publishSessionOwner,\s*\}\)/,
  "only the production Research mission adapter requests trusted launch policy and rejects offline replay",
);

