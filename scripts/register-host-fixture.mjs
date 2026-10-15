// Integration tests use a separately checked-out, pinned Cave fixture.
// This loader is not included in package exports or used by production.
import { register } from 'node:module';
import { hostFixture } from './host-fixture.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const fixture = hostFixture();
register(pathToFileURL(resolve(fixture, 'scripts/test-alias-loader.mjs')));
register('./host-fixture-loader.mjs', import.meta.url, { data: { fixture: resolve(fixture) } });
