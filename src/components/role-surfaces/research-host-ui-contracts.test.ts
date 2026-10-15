import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const researchDetail = readFileSync(new URL("./research-mission-detail.tsx", import.meta.url), "utf8");
const researchResources = readFileSync(new URL("./research-tab-resources.tsx", import.meta.url), "utf8");
const researchCss = readFileSync(new URL("../../styles/research-reader.css", import.meta.url), "utf8");
test("research cites the mission's used sources under the synthesis", () => {
  assert.match(researchDetail, /import \{ CitationSources \} from "@opencoven\/research-host\/components\/ui\/citation"/, "reuses the shared component");
  assert.match(researchDetail, /import \{ sourcesToCitations \} from "@opencoven\/research-host\/lib\/citations"/, "adapts research source rows to citations");
  assert.match(
    researchDetail,
    /sourcesToCitations\(mission\.sources\.filter\(\(source\) => source\.status === "used"\)\)/,
    "only the sources the mission actually used are cited",
  );
});

test("the research surface is gated on the research capability", () => {
  assert.match(
    researchResources,
    /\{context\.activeFamiliar\?\.xResearchEnabled \? \(\s*<ResearchXSources/,
    "ResearchXSources renders only when the familiar has X research enabled",
  );
});

test("the Research desk consumes the same links store", () => {
  // The old collapsible shelf became two consumers of one shared hook: the
  // Prompt tab's quick saves and the Resources tab's browser (cave-dl74).
  const hook = readFileSync(
    path.join(repoRoot, "src/components/role-surfaces/use-research-links.ts"),
    "utf8",
  );
  assert.match(hook, /fetch\("\/api\/research\/links"/, "the hook is the one client for the store");
  assert.match(hook, /source: "desk"/, "desk saves are attributed");

  const resources = readFileSync(
    path.join(repoRoot, "src/components/role-surfaces/research-tab-resources.tsx"),
    "utf8",
  );
  assert.match(resources, /useResearchLinks/, "Resources reads through the shared hook");
  assert.match(
    resources,
    /groupSavedLinksByUsage\(/,
    "Resources renders workflow-first organized groups",
  );

  const prompt = readFileSync(
    path.join(repoRoot, "src/components/role-surfaces/research-tab-prompt.tsx"),
    "utf8",
  );
  assert.match(prompt, /useResearchLinks/, "quick saves read the same store");
});

test("Research views preserve tolerant category access", () => {
for (const rel of [
    "src/components/role-surfaces/research-tab-resources.tsx",
    "src/components/role-surfaces/research-tab-prompt.tsx",
  ]) {
    const source = readFileSync(path.join(repoRoot, rel), "utf8");
    assert.match(source, /linkCategoryMeta\(/);
    assert.doesNotMatch(source, /LINK_CATEGORY_META\[/);
  }
});

test("Research reader preserves the shared prose measure", () => {
assert.doesNotMatch(
    researchCss,
    /--document-reader-column-width:\s*\d+(?:px|rem)/,
    "Research must not restore fixed reader widths",
  );
});
