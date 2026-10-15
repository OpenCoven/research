import path from "node:path";
import { pathToFileURL } from "node:url";

/** Read a core-owned contract from the explicitly selected integration fixture. */
export function hostSourceUrl(relative: string): URL {
  const fixture = process.env.COVEN_RESEARCH_HOST_FIXTURE;
  if (!fixture) throw new Error("COVEN_RESEARCH_HOST_FIXTURE is required");
  if (!relative.startsWith("src/") || relative.split("/").includes("..")) {
    throw new Error("Expected a fixture-relative src path");
  }
  return pathToFileURL(path.resolve(fixture, relative));
}
