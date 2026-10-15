// Assemble one deployable site from the two in this repo:
//
//   dist/                      Boxwright  (index.html, styles.css, catalog.js, app.js copied as-is)
//   dist/experience-india/     Experience India, built by its own build.mjs with --base=/experience-india
//
// Both get the switcher bar from switcher.html injected after <body> so you can tab between them.
// Drop the INJECT lines below when either site ships alone on its own domain.
//
//   node build.mjs            -> dist/
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const switcher = readFileSync(join(here, "switcher.html"), "utf8");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// Boxwright at the root
for (const f of ["styles.css", "catalog.js", "app.js"]) cpSync(join(here, f), join(dist, f));
const html = readFileSync(join(here, "index.html"), "utf8").replace(/<body>\n?/, (m) => m + switcher + "\n");
writeFileSync(join(dist, "index.html"), html);
console.log("boxwright -> dist/");

// Experience India under /experience-india/
execFileSync(
  process.execPath,
  ["build.mjs", "--check", "--base=/experience-india", `--out=${join(dist, "experience-india")}`, `--inject=${join(here, "switcher.html")}`],
  { cwd: join(here, "experience-india"), stdio: "inherit" }
);
