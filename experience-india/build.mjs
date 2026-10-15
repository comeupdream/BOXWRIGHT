// Experience India — tiny static site generator. No dependencies.
//
//   node build.mjs            build pages/ + assets/ -> dist/
//   node build.mjs --serve    build, then serve dist/ on http://localhost:4173 and rebuild on change
//   node build.mjs --check    build and fail if any {{ variable }} or include is unresolved
//   node build.mjs --bundle   also write dist/preview.html: the whole site in one hash-routed file
//   node build.mjs --base=/experience-india --out=../dist/experience-india   mount under a sub-path
//
// Output uses clean URLs: pages/explore-india.html -> dist/explore-india/index.html, so links like
// /explore-india work on any static host (Render, Netlify, Vercel, Cloudflare Pages).
//
// Templating:
//   <!--PAGE { "title": "...", "description": "...", "nav": "explore" } -->   page metadata (first line)
//   <!-- @include partials/header.html -->                                  partial include (recursive)
//   {{ brand.name }}                                                        value from site.config.json or page meta
//   {{#if analytics.ga4}} ... {{/if}}                                        block kept only when the value is truthy
//   {{#unless flagship.waitlistOpen}} ... {{/unless}}                        block kept only when the value is falsy

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.join(ROOT, "pages");
const PARTIALS = path.join(ROOT, "partials");
const ASSETS = path.join(ROOT, "assets");
const args = new Set(process.argv.slice(2));
// --base=/experience-india  mounts the site under a sub-path (every /link and /asset is prefixed)
const BASE = ((process.argv.find((a) => a.startsWith("--base=")) || "--base=").slice(7)).replace(/\/$/, "");
// --out=<dir>  write somewhere other than ./dist
const OUT = process.argv.find((a) => a.startsWith("--out="));
// --inject=<file>  HTML snippet inserted right after <body> on every page (e.g. a site switcher bar)
const INJECT = process.argv.find((a) => a.startsWith("--inject="));
const DIST = OUT ? path.resolve(process.cwd(), OUT.slice(6)) : path.join(ROOT, "dist");

function lookup(ctx, expr) {
  return expr.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}

function render(src, ctx, file, problems) {
  // includes (recursive)
  src = src.replace(/<!--\s*@include\s+([\w./-]+)\s*-->/g, (_, rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      problems.push(`${file}: missing include ${rel}`);
      return "";
    }
    return render(fs.readFileSync(p, "utf8"), ctx, rel, problems);
  });
  // conditionals
  src = src.replace(/\{\{#(if|unless)\s+([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, kind, expr, body) => {
    const v = lookup(ctx, expr);
    const truthy = Array.isArray(v) ? v.length > 0 : Boolean(v);
    return (kind === "if") === truthy ? body : "";
  });
  // variables
  src = src.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, expr) => {
    const v = lookup(ctx, expr);
    if (v === undefined) {
      problems.push(`${file}: unresolved {{ ${expr} }}`);
      return "";
    }
    return String(v);
  });
  return src;
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}

export function build() {
  const problems = [];
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(ASSETS, path.join(DIST, "assets"));
  for (const f of ["robots.txt", "favicon.svg"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(DIST, f));
  }
  if (BASE) fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);

  const pages = [];
  const allPages = [];
  for (const name of fs.readdirSync(PAGES).filter((n) => n.endsWith(".html")).sort()) {
    const raw = fs.readFileSync(path.join(PAGES, name), "utf8");
    const m = raw.match(/^<!--PAGE\s*([\s\S]*?)-->/);
    let meta = {};
    if (m) {
      try {
        meta = JSON.parse(m[1]);
      } catch (e) {
        problems.push(`${name}: bad PAGE metadata JSON (${e.message})`);
      }
    } else problems.push(`${name}: missing <!--PAGE {...} --> header`);
    const body = m ? raw.slice(m[0].length) : raw;
    const urlPath = name === "index.html" ? "/" : `/${name.replace(/\.html$/, "")}`;
    const page = {
      ...meta,
      path: urlPath,
      file: name,
      canonical: `${config.brand.url}${BASE}${urlPath === "/" ? "/" : urlPath}`,
      year: String(new Date().getFullYear()),
    };
    const ctx = { ...config, page, nav: navFlags(meta.nav) };
    let html = render(body, ctx, name, problems);
    html = html.replace(/\n{3,}/g, "\n\n");
    if (BASE) html = html.replace(/(href|src|content)="\/(?!\/)/g, `$1="${BASE}/`);
    if (INJECT) html = html.replace(/<body>\n?/, (m) => m + fs.readFileSync(path.resolve(process.cwd(), INJECT.slice(9)), "utf8") + "\n");
    const outFile = name === "index.html" ? path.join(DIST, "index.html") : path.join(DIST, name.replace(/\.html$/, ""), "index.html");
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    page.html = html;
    if (!meta.noindex) pages.push(page);
    allPages.push(page);
  }

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10);
  const sm =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages
      .map(
        (p) =>
          `  <url><loc>${p.canonical}</loc><lastmod>${today}</lastmod><priority>${p.path === "/" ? "1.0" : "0.7"}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sm);
  if (args.has("--bundle")) bundle(allPages, config);
  return { problems, count: pages.length };
}

// --bundle: one self-contained preview page (dist/preview.html) with every page inside it and a
// hash router, for hosts that serve a single HTML file (e.g. a claude.ai artifact). Links such as
// /explore-india become #explore-india, assets become relative, forms show their success panel.
function bundle(pages, config) {
  const slug = (p) => (p.path === "/" ? "home" : p.path.slice(1));
  const relink = (html) =>
    html
      .replace(/href="\/([\w-]*)(#[\w-]+)?"/g, (_, s) => `href="#${s || "home"}"`)
      .replace(/(src|href)="\/assets\//g, '$1="assets/');
  const home = pages.find((p) => p.path === "/");
  const headerEnd = home.html.indexOf('<main id="main">') + '<main id="main">'.length;
  const header = relink(home.html.slice(home.html.indexOf("<header"), headerEnd));
  const footer = relink(home.html.slice(home.html.indexOf("</main>") + "</main>".length, home.html.indexOf("<script")));
  const sections = pages
    .map((p) => {
      const inner = p.html.slice(p.html.indexOf('<main id="main">') + '<main id="main">'.length, p.html.indexOf("</main>"));
      return `<div class="page" data-page="${slug(p)}" data-title="${p.title}" hidden>${relink(inner)}</div>`;
    })
    .join("\n");
  const css = fs.readFileSync(path.join(ASSETS, "css", "site.css"), "utf8");
  const js = fs.readFileSync(path.join(ASSETS, "js", "site.js"), "utf8");
  const fonts = home.html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
  const out = `<title>${config.brand.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
${css}
.reveal { opacity: 1; transform: none; }
.site-header { top: env(safe-area-inset-top, 0px); }
.preview-note { position: fixed; left: 12px; bottom: max(12px, env(safe-area-inset-bottom, 0px)); z-index: 60; background: var(--ink); color: #fff; font-size: .78rem; padding: 8px 12px; border-radius: 999px; opacity: .85; pointer-events: none; }
</style>
${header}
${sections}
${footer}
<div class="preview-note" aria-hidden="true">Preview build · forms are simulated</div>
<script>
${js}
(function () {
  var pages = document.querySelectorAll(".page");
  function show() {
    var key = (location.hash || "#home").replace(/^#/, "");
    var found = false;
    pages.forEach(function (p) { var on = p.dataset.page === key; p.hidden = !on; if (on) { found = true; document.title = p.dataset.title + " | ${config.brand.name}"; } });
    if (!found) pages.forEach(function (p) { p.hidden = p.dataset.page !== "home"; });
    document.querySelectorAll(".nav-links a").forEach(function (a) { a.getAttribute("href") === "#" + key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    var menu = document.getElementById("mobile-menu"); if (menu) { menu.classList.remove("open"); var t = document.querySelector(".nav-toggle"); if (t) { t.setAttribute("aria-expanded", "false"); t.querySelector(".label").textContent = "Menu"; } }
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", show);
  show();
  document.querySelectorAll("form").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var ok = document.getElementById(f.getAttribute("data-success"));
      f.style.display = "none"; if (ok) ok.style.display = "block";
    }, true);
  });
})();
</script>
`;
  fs.writeFileSync(path.join(DIST, "preview.html"), out);
  console.log("bundled preview -> dist/preview.html");
}

// Flags like {{#if nav.explore}} for marking the active menu item.
function navFlags(active) {
  const keys = ["home", "explore", "medical", "about", "faq", "contact"];
  return Object.fromEntries(keys.map((k) => [k, k === active]));
}

function report({ problems, count }) {
  console.log(`built ${count} pages -> ${path.relative(process.cwd(), DIST) || "."}`);
  for (const p of problems) console.warn("  warn:", p);
  return problems.length === 0;
}

function serve() {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".mp4": "video/mp4",
    ".woff2": "font/woff2",
  };
  const port = Number(process.env.PORT || 4173);
  http
    .createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index.html";
      let file = path.join(DIST, p);
      if (!file.startsWith(DIST)) return void res.writeHead(403).end();
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, () => console.log(`serving http://localhost:${port}`));
  for (const dir of [PAGES, PARTIALS, ASSETS]) {
    fs.watch(dir, { recursive: true }, () => {
      try {
        report(build());
      } catch (e) {
        console.error(e);
      }
    });
  }
  fs.watch(path.join(ROOT, "site.config.json"), () => report(build()));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ok = report(build());
  if (args.has("--check") && !ok) process.exit(1);
  if (args.has("--serve")) serve();
}
