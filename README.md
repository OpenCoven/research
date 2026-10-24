# OpenCoven Research

Optional Research subsystem for Coven Cave. This local extraction is under
integration; it is not yet published or ready for an independent installation.

The package currently contains Research UI, API handlers, mission execution,
ingestion, media workers, and their colocated tests. `contracts/source-provenance.json`
records the Cave revisions from which each production file was extracted.
`contracts/host-imports.json` inventories host dependencies; it is a draft
contract, not yet the final supported host API.

## Local verification

Use Node 24.18 and pnpm 10.34.5:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
pnpm check
```

The build compiles TypeScript/TSX to ESM and preserves client directives and
component-owned CSS. It does not replace typechecking or integration tests.
The boundary check verifies static/dynamic imports against package files and
the declared host inventory.

The test fixture loader uses a separately checked-out Cave revision and rejects
other heads. It is test-only and is not part of the production exports:

```sh
COVEN_RESEARCH_HOST_FIXTURE=/path/to/pinned/cave \
  node --experimental-strip-types --import ./scripts/register-host-fixture.mjs \
  --test src/lib/research-source-url.test.ts \
  src/lib/research-blog-directions.test.ts \
  src/lib/research-prompt-brief.test.ts \
  src/lib/research-topic-discovery.test.ts \
  src/lib/research-findings-integrity.test.ts
```

Run the complete Node and component suites with the same fixture environment:

```sh
pnpm test:node
pnpm test:components
pnpm typecheck:host
```

The extraction passes 1,453 Node tests and 182 component tests against the clean,
published Cave host-contract commit pinned in `contracts/host-fixture.json`.
That pin is shared by all runners and CI. The host-contract prerequisite landed in
[Cave PR #6006](https://github.com/OpenCoven/coven-cave/pull/6006).
Research protocol schemas and their fixtures live in this repository.

`pnpm typecheck:host` validates production source against these named adapters.
The fixture typecheck resolves Next through the host peer instance so that its
private response symbols have one identity. Production integration must also
share the host's Next and React instances.

## Remaining integration

- Finalize explicit typed host exports and version their compatibility contract.
- Preserve core SQLite storage for offline restore/deletion; optional ingestion,
  embedding and retrieval implementations live in this package.
- Land the host adapters and optional activation integration, including the absent-package build fallback.
- Run the complete package tests and Cave's absent/disabled/enabled matrix.
- Publish a pinned release, remove the replaced Cave source, and measure results.

Track delivery in [Cave issue #5997](https://github.com/OpenCoven/coven-cave/issues/5997).

## Release contract

Research is distributed only as a package consumed by Cave. It has no standalone Vercel application or deployment; package CI verifies its host contract and release artifact.

Releases use a signed `v<package version>` tag on a commit merged into `main`.
The release workflow reruns build, boundary, type, Node, and component checks
against the immutable Cave fixture before publishing a tarball and SHA256SUMS.
Cave must pin the versioned release asset and lockfile integrity; never a branch,
`latest` URL, or a local development tarball. Runtime exports are limited to
`@opencoven/research/client`, `@opencoven/research/server`, and package metadata.

The package is an extension of Cave, not a standalone application. The host provides authorization, session ownership, durable storage/recovery, shared UI, and peer React/Next instances through explicit named adapters. Runtime contract version 2 is checked by Cave before dispatch or startup. It requires mission correlation, stable automation IDs and adoption keys, and observed definition revisions for lifecycle mutations. The historical `codex-automations` export names now resolve only to Coven SDK operations; they do not authorize direct legacy filesystem access.

The version 2 change requires a coordinated Research release and Cave release-asset/lockfile update before the Cave integration can land. Cave's existing v0.1.0 pin is version 1 and must be rejected before dispatch. Local fixture verification is not evidence that the published package has migrated.

A mission linked to a definition absent from Coven refuses reconciliation or cancellation with `research-automation-import-required`. Preserve the original ID and source files, and review an explicit source-preserving import before retrying. Do not automatically create a replacement definition or use a legacy importer that drops Research cwd, familiar, model, tags, or other metadata. Unsupported execution environment, reasoning effort, skill path, multiple roots/familiars, and non-hour schedules remain explicit refusals; a release does not supply those missing runtime semantics.

Cave provides an explicit local `POST /api/research-automation-import` preview/apply workflow for existing complete mission links. Preview freezes supported metadata, original ID, source digest and an explicitly selected timezone; apply creates that ID paused with stable adoption keys and leaves the TOML unchanged. Reconciliation then refreshes the same mission link from Coven, and cancellation of an already-paused import sends no redundant lifecycle command. Unsupported or ambiguous mappings still refuse. See Cave `docs/workflows/research-automation-import.md` for the reviewed request format.
