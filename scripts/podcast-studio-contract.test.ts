import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const modals = readFileSync(new URL("../src/components/role-surfaces/research-studio-modals.tsx", import.meta.url), "utf8");

test("both studio surfaces render the screenplay, and the flat list is gone", () => {
  assert.match(modals, /import \{ PodcastTranscript \}/, "the studio imports the shared transcript");
  assert.match(
    modals,
    /content\?\.kind === "podcast" \? \(\s*<PodcastTranscript[\s\S]{0,200}?density="compact"/,
    "the review sheet renders the screenplay compactly",
  );
  assert.match(
    modals,
    /<span className="research-studio-viewer__label">Transcript<\/span>\s*<PodcastTranscript/,
    "the viewer renders it under the audio player so the episode can be read along with",
  );
  // The JSX list it replaced is gone. The markdown serializer still writes
  // "**Host:** …" — that is a copy format, not a rendered transcript.
  assert.doesNotMatch(
    modals,
    /<ol className="research-studio-review__list">\s*\{content\.script\.map/,
    "the flat bold-run list it replaced is gone",
  );
  assert.match(
    modals,
    /\*\*\$\{segment\.speaker === "host" \? "Host" : "Guest"\}:\*\*/,
    "the markdown copy format keeps its speaker prefix",
  );
});


const css = readFileSync(new URL("../src/styles/globals/surface-research-studio.css", import.meta.url), "utf8");

test("a narrator run keeps the full width instead of an empty gutter", () => {
  assert.match(
    css,
    /\.podcast-transcript__run:not\(\[class\*="--host"\]\):not\(\[class\*="--guest"\]\) \{\s*grid-template-columns: minmax\(0, 1fr\);/,
  );
  // Speaker tone rides one variable so the gutter, rail and cast chip agree.
  assert.match(css, /\.podcast-transcript__run--host \{ --pt-voice: var\(--accent-presence\); \}/);
  assert.match(css, /\.podcast-transcript__run--guest \{ --pt-voice: var\(--color-success\); \}/);
});
