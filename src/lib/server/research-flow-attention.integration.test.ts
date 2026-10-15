import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { ResearchMission } from "@opencoven/research-host-test/lib/research-missions";
const home = mkdtempSync(path.join(tmpdir(), "research-attention-"));
process.env.COVEN_HOME = path.join(home, ".coven");
process.env.COVEN_CAVE_HOME = path.join(home, "cave");
process.env.COVEN_RESEARCH_MISSIONS_DIR = path.join(home, "research-missions");
const { loadInbox } = await import("@opencoven/research-host-test/lib/cave-inbox");
after(() => rmSync(home, { recursive: true, force: true }));
function mission(id: string, patch: Partial<ResearchMission> = {}): ResearchMission {
  return {
    version: 1,
    id,
    familiarId: "sage",
    title: "Research sources",
    intent: "Review sources",
    mode: "autoresearch",
    modeSource: "user",
    deliverable: "findings",
    constraints: [],
    bounds: {
      wallClockMinutes: 60,
      maxIterations: 6,
      checkpointEvery: 2,
      sourceTarget: 12,
      stopWhenCostUnavailable: false,
    },
    status: "running",
    createdAt: "2026-09-05T12:00:00.000Z",
    updatedAt: "2026-09-05T12:00:00.000Z",
    iterations: [],
    artifacts: [],
    sources: [],
    ...patch,
  };
}
test("production Research persistence emits the checkpoint's parent notification", async () => {
  const { createResearchMissionWorkspace } = await import("@opencoven/research-host-test/lib/server/research-mission-store");
  const { makeProductionResearchMissionRunner } = await import("./research-mission-runner.ts");
  await createResearchMissionWorkspace(mission("production-research", { status: "paused" }));
  const updated = await makeProductionResearchMissionRunner().act("production-research", { action: "resume" });
  assert.equal(updated.status, "checkpoint");
  const { items } = await loadInbox();
  assert.equal(items.filter((item) => item.auto === "flow-attention:mission:production-research").length, 1);
});
