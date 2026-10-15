import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { hostFixture } from './host-fixture.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = hostFixture();
const apiRoot = path.join(root, 'src/app/api');
const { routes: contracts } = JSON.parse(readFileSync(path.join(root, 'contracts/http-routes.json'), 'utf8'));
function exportedMethods(source: string): string[] {
  const method = "GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS";
  const functions = [...source.matchAll(new RegExp(`export (?:async )?function (${method})\\b`, "g"))]
    .map((match) => match[1]);
  const constants = [...source.matchAll(new RegExp(`export const (${method})\\b`, "g"))]
    .map((match) => match[1]);
  const aliases = [...source.matchAll(new RegExp(`^\\s*[A-Za-z_$][\\w$]*\\s+as (${method})\\b`, "gm"))]
    .map((match) => match[1]);
  return [...functions, ...constants, ...aliases];
}

// Client v1 routes hand response construction to the shared envelope builders
// so every route answers in the same shape. Name those builders here rather
// than inlining `client-v1/responses.ts` into the route source: the builders
// are recognisable at the call site, the check does not depend on how a route
// spells the import specifier (`…/responses` vs `…/responses.ts`), and the
// readsJson / invalidJson assertions below keep reading the route itself
// instead of an unrelated module's text.
function usesJsonResponse(source: string): boolean {
  return /NextResponse\.json|Response\.json|new Response\(|clientV1(?:Success|Error|RateLimit)Response\s*\(|canonicalMemory(?:Json|ListResponse|OverviewResponse|DetailResponse)\s*\(/.test(source);
}

function effectiveRouteSource(file: string, source: string): string {
 const parts = [source];
 if (source.includes('research-run-gateway-route.ts')) parts.push(readFileSync(path.join(root, 'src/lib/server/research-run-gateway-route.ts'), 'utf8'));
 if (source.includes('@opencoven/research-host/lib/server/saved-links-route')) parts.push(readFileSync(path.join(fixture, 'src/lib/server/saved-links-route.ts'), 'utf8'));
 return parts.join('\n');
}
test('extracted routes retain response, body, path, and authorization contracts', () => {
function routesIn(directory: string): string[] { return readdirSync(directory, {withFileTypes:true}).flatMap(entry => { const file = path.join(directory,entry.name); return entry.isDirectory() ? routesIn(file) : entry.name === 'route.ts' ? ['/'+path.relative(apiRoot,path.dirname(file)).split(path.sep).join('/')] : []; }); }
assert.deepEqual(routesIn(apiRoot).sort(), contracts.map((c: {route:string})=>c.route).sort(), 'every package route retains a reviewed HTTP contract');
for (const contract of contracts) {
  const file = path.join(apiRoot, ...contract.route.slice(1).split("/"), "route.ts");
  const source = readFileSync(file, "utf8");
  const effectiveSource = effectiveRouteSource(file, source);

  assert.deepEqual(exportedMethods(source), contract.methods, `${contract.route} HTTP method exports changed`);
  assert.equal(usesJsonResponse(effectiveSource), true, `${contract.route} must return an explicit Response/NextResponse`);

  const readsJson = contract.optionalJsonBody
    ? /await req\.text\(\)/.test(effectiveSource) && /JSON\.parse\(/.test(effectiveSource)
    : /req\.json\(\)|readJsonBody[<(]|parse[A-Za-z]*JsonBody[<(]/.test(effectiveSource);
  assert.equal(readsJson, contract.readsJson === true, `${contract.route} JSON body contract changed`);

  if (contract.invalidJson === "guarded") {
    assert.match(effectiveSource, /invalid json|invalid JSON|readJsonBody/, `${contract.route} must preserve invalid-JSON handling`);
  }
  if (contract.invalidJson === "fallback-empty") {
    assert.match(source, /let body:[\s\S]{0,160}=\s*\{\}/, `${contract.route} must initialize an optional request body`);
    assert.match(source, /try\s*\{[\s\S]{0,120}req\.json\(\)[\s\S]{0,80}\}\s*catch\s*\{/, `${contract.route} must preserve optional-body malformed JSON fallback`);
  }
  if (contract.invalidJson === "legacy-unhandled") {
    assert.doesNotMatch(source, /invalid json|invalid JSON/, `${contract.route} legacy invalid-JSON behavior changed`);
  }
  if (contract.optionalJsonBody) {
    assert.match(effectiveSource, /rawBody\.trim\(\)/, `${contract.route} must accept a missing request body`);
  }
  if (contract.pathGuard) {
    assert.match(source, /path not allowed|collection path not allowed/, `${contract.route} must preserve path-deny errors`);
    assert.match(source, /status:\s*403/, `${contract.route} path guard must preserve 403 response`);
  }
  if (contract.localOriginGuard) {
    // effectiveSource, not source — matching the readsJson/invalidJson checks
    // above. A route may apply the guard through an injected dependency
    // (/x/oauth/start passes rejectNonLocalRequest into
    // createXOAuthStartRouteHandlers, which calls it), and reading only the
    // route file would report that as a missing guard when it is present.
    // rejectResearchMediaRequest counts: it CALLS rejectNonLocalRequest first
    // and returns null whenever that passes, so it is a narrowing rather than a
    // weakening. It relaxes only when the host and the origin are both local
    // AND a signed media ticket validates — the carve-out exists because a
    // native <audio>/<video> element cannot go through patched fetch, so the
    // ticket proves the sidecar credential instead (#4634).
    assert.match(
      effectiveSource,
      /isLocalOrigin|rejectNonLocalRequest|rejectResearchMediaRequest/,
      `${contract.route} must preserve local-origin guard`,
    );
    if (effectiveSource.includes("rejectResearchMediaRequest")) {
      assert.match(
        effectiveSource,
        /await\s+rejectResearchMediaRequest\(\s*[A-Za-z_$][\w$]*\s*\)/,
        `${contract.route} must call the shared media guard`,
      );
      const guardSource = readFileSync(
        path.join(fixture, "src/lib/server/api-security.ts"),
        "utf8",
      );
      assert.match(
        guardSource,
        /export async function rejectResearchMediaRequest[\s\S]{0,200}rejectNonLocalRequest\(req\)/,
        "rejectResearchMediaRequest must still delegate to the local-origin guard",
      );
    } else if (effectiveSource.includes("rejectNonLocalRequest")) {
      assert.match(effectiveSource, /rejectNonLocalRequest\(req\)/, `${contract.route} must call the shared local-origin guard`);
    } else {
      assert.match(effectiveSource, /status:\s*403/, `${contract.route} local-origin guard must preserve 403 response`);
    }
  }
}

{
  const generationsSource = readFileSync(
    path.join(apiRoot, "research", "generations", "route.ts"),
    "utf8",
  );
  assert.match(
    generationsSource,
    /validateCreateResearchGenerationInput/,
    "research generations must keep input validation at the API boundary",
  );
  assert.match(
    generationsSource,
    /"media-not-ready" \? 409/,
    "research generations must expose media readiness as a conflict, never a fake queued record",
  );
}

});
