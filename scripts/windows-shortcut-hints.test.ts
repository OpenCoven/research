import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (relative: string) => readFile(new URL(relative, import.meta.url), "utf8");

const repoViewer = await read("../src/components/role-surfaces/research-github-repo-viewer.tsx");
assert.doesNotMatch(repoViewer, /<kbd>\{shortcut\.keys\}<\/kbd>|<kbd>⌘B<\/kbd>|<kbd>⌘⇧U<\/kbd>|title="[^"]*[⌘⌥⇧↵][^"]*"|: "Open on GitHub  ⌘↵";/, "ResearchGithubRepoViewer no longer renders a Mac glyph verbatim");
assert.match(repoViewer, /platformizeHint\("⌘B", keys\)[\s\S]*platformizeHint\("⌘⇧U", keys\)[\s\S]*platformizeHint\(shortcut\.keys, keys\)/, "ResearchGithubRepoViewer platformizes the shortcuts sheet and overflow menu");
assert.match(repoViewer, /platformizeHint\("Copy repository URL  ⌘⇧U", keys\)[\s\S]*platformizeHint\("Hide file browser  ⌘\\\\", keys\)[\s\S]*platformizeHint\("Show file browser  ⌘\\\\", keys\)[\s\S]*platformizeHint\("Copy path  ⌘⇧C", keys\)[\s\S]*platformizeHint\("Soft wrap  ⌥Z", keys\)/, "ResearchGithubRepoViewer platformizes every tooltip");

