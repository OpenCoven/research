import assert from "node:assert/strict";
import { researchMediaOpenFlags } from "../src/lib/server/research-media-store.ts";

// Media files use O_NOFOLLOW on POSIX. Windows lacks a dependable equivalent,
// so its explicit fallback keeps the lstat + post-open FileHandle.stat checks.
{
  const simulatedNoFollow = 0x20_0000;
  assert.equal(
    researchMediaOpenFlags("darwin", simulatedNoFollow) & simulatedNoFollow,
    simulatedNoFollow,
  );
  assert.equal(
    researchMediaOpenFlags("linux", simulatedNoFollow) & simulatedNoFollow,
    simulatedNoFollow,
  );
  assert.equal(
    researchMediaOpenFlags("win32", simulatedNoFollow) & simulatedNoFollow,
    0,
  );
}

