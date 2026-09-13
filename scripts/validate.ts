/**
 * Checks apps.json the way Chrysalis reads it, but strictly: Chrysalis skips
 * an entry it cannot use, while this fails the pull request that added it.
 *
 *   bun scripts/validate.ts            fields only
 *   bun scripts/validate.ts --clone    also clone each app and check its manifest
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const clone = process.argv.includes("--clone");
const problems: string[] = [];
const fail = (where: string, what: string) => problems.push(`${where}: ${what}`);

const text = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;

let doc: unknown;
try {
  doc = JSON.parse(fs.readFileSync(path.join(import.meta.dir, "..", "apps.json"), "utf8"));
} catch (e) {
  console.error(`apps.json is not valid JSON: ${(e as Error).message}`);
  process.exit(1);
}

const apps = (doc as { apps?: unknown }).apps;
if (!Array.isArray(apps)) {
  console.error('apps.json needs an "apps" array');
  process.exit(1);
}

const ids = new Set<string>();
const repositories = new Set<string>();
const allowed = new Set(["id", "name", "description", "author", "repository", "ref", "tags", "added"]);

for (const [i, raw] of apps.entries()) {
  const e = raw as Record<string, unknown>;
  const where = `apps[${i}]${typeof e?.id === "string" ? ` (${e.id})` : ""}`;
  if (!e || typeof e !== "object" || Array.isArray(e)) {
    fail(where, "must be an object");
    continue;
  }
  for (const key of Object.keys(e)) if (!allowed.has(key)) fail(where, `unknown field "${key}"`);
  if (typeof e.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(e.id)) fail(where, "id: lowercase letters, digits, - and _, at most 64");
  else if (ids.has(e.id)) fail(where, "id is already used");
  else ids.add(e.id);
  if (!text(e.name, 80)) fail(where, "name: 1 to 80 characters");
  if (!text(e.description, 500)) fail(where, "description: 1 to 500 characters");
  if (!text(e.author, 80)) fail(where, "author: 1 to 80 characters");
  if (typeof e.repository !== "string" || !/^https:\/\/[^\s/]+\/[^\s]+$/.test(e.repository)) fail(where, "repository: an https:// git address");
  else {
    const key = e.repository.replace(/\/+$/, "").replace(/\.git$/i, "").toLowerCase();
    if (repositories.has(key)) fail(where, "repository is already listed");
    repositories.add(key);
  }
  if (e.ref !== undefined && (typeof e.ref !== "string" || !/^[\w./-]{1,100}$/.test(e.ref) || e.ref.includes(".."))) fail(where, "ref: a branch or tag name");
  if (e.tags !== undefined) {
    if (!Array.isArray(e.tags) || e.tags.length > 8) fail(where, "tags: at most 8");
    else for (const t of e.tags) if (typeof t !== "string" || !/^[a-z0-9][a-z0-9 -]{0,31}$/.test(t)) fail(where, `tag "${String(t)}": lowercase, at most 32 characters`);
  }
  if (typeof e.added !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.added) || Number.isNaN(Date.parse(e.added))) fail(where, "added: the date, YYYY-MM-DD");

  if (clone && typeof e.repository === "string" && !problems.some((p) => p.startsWith(where))) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-app-"));
    try {
      const branch = typeof e.ref === "string" ? ["--branch", e.ref] : [];
      execFileSync("git", ["clone", "--quiet", "--depth", "1", ...branch, e.repository, dir], { stdio: "pipe", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")) as Record<string, unknown>;
      if (!text(manifest.name, 200)) fail(where, "the app's manifest.json has no name");
      if (typeof manifest.version !== "string") fail(where, "the app's manifest.json has no version");
      if (!["web", "app", "skin", "vite"].includes(String(manifest.kind))) fail(where, 'the app\'s manifest.json kind must be "web", "app" or "skin"');
    } catch (err) {
      fail(where, `could not clone it and read manifest.json: ${String((err as Error).message).split("\n")[0]}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`apps.json: ${apps.length} app${apps.length === 1 ? "" : "s"}, all valid`);
