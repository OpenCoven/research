import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** All independent test runners must exercise the same immutable host revision. */
export function hostFixture() {
  const configured = process.env.COVEN_RESEARCH_HOST_FIXTURE;
  if (!configured) throw Error('Set COVEN_RESEARCH_HOST_FIXTURE to the pinned Cave checkout');
  const fixture = resolve(configured);
  const { revision } = JSON.parse(readFileSync(new URL('../contracts/host-fixture.json', import.meta.url), 'utf8'));
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Host fixture must pin a full commit SHA');
  const actual = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fixture, encoding: 'utf8' }).trim();
  if (actual !== revision) throw Error(`Host fixture revision ${actual} differs from ${revision}`);
  return fixture;
}
