// Copyright 2026 Anthony DiTano. Licensed under GPL-3.0-or-later. See LICENSE.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pagesUrl = "https://aditano.github.io/Curxline/";
const failures = [];

function fail(message) {
  failures.push(message);
}

function isExternal(value) {
  return /^(?:data:|mailto:|javascript:|https?:|#)/i.test(value);
}

function localTarget(value, label) {
  const clean = value.split("#")[0].split("?")[0];
  if (!clean) return;
  if (clean.startsWith("/") || clean.split(/[\\/]/).includes("..")) {
    fail(`${label} leaves the project: ${value}`);
    return;
  }
  if (!existsSync(join(root, clean))) fail(`${label} is missing: ${value}`);
}

const htmlPath = join(root, "index.html");
const html = readFileSync(htmlPath, "utf8");

if (!html.startsWith("<!doctype html>")) fail("index.html must start with an HTML5 doctype.");
if (!/<html\s+lang="en">/i.test(html)) fail('index.html must set <html lang="en">.');
if (!/<meta\s+charset="utf-8">/i.test(html)) fail("index.html must declare UTF-8.");
if (!/<title>Curxline<\/title>/.test(html)) fail("index.html must set the title to Curxline.");

const scriptOpens = html.match(/<script\b[^>]*>/gi) || [];
if (scriptOpens.length !== 1) fail(`Expected one script element, found ${scriptOpens.length}.`);
if (!html.includes("</script>")) fail("The page script is not closed.");

const idSet = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/\sfor="([^"]+)"/g)) {
  if (!idSet.has(match[1])) fail(`Label for "${match[1]}" does not match an element id.`);
}

const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] || "";
if (!script.trim()) fail("Could not read the page script.");
for (const match of script.matchAll(/\$\("#([^"]+)"\)/g)) {
  if (!idSet.has(match[1])) fail(`Script looks up missing id #${match[1]}.`);
}

const attrRe = /\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
for (const match of html.matchAll(attrRe)) {
  const value = (match[1] ?? match[2] ?? "").trim();
  if (!value) {
    fail("Found an empty href or src.");
    continue;
  }
  if (isExternal(value)) continue;
  localTarget(value, "HTML link");
}

const style = html.match(/<style>([\s\S]*)<\/style>/)?.[1] || "";
for (const match of style.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
  const value = match[1].trim();
  if (!value || isExternal(value)) continue;
  localTarget(value, "CSS url");
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (!readme.includes(pagesUrl)) fail(`README must link to ${pagesUrl}`);
if (!/Copyright 2026 Anthony DiTano/.test(readme)) fail("README must include the copyright notice.");
for (const match of readme.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
  const value = match[1].trim();
  if (!value || isExternal(value)) continue;
  localTarget(value, "README link");
}

if (!existsSync(join(root, "LICENSE"))) fail("LICENSE is missing.");
const license = readFileSync(join(root, "LICENSE"), "utf8");
if (!license.startsWith("                    GNU GENERAL PUBLIC LICENSE\n")) {
  fail("LICENSE must be the official GNU GPL v3 text.");
}
if (!license.includes("Version 3, 29 June 2007")) fail("LICENSE is not GPL version 3.");

if (failures.length) {
  console.error(`HTML check failed: ${failures.length}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`HTML check passed: ${idSet.size} ids, local links resolved, README links to the Pages site.`);
