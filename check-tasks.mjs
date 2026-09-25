import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) {
  console.error("Could not find the page script.");
  process.exit(1);
}

function element() {
  const el = {
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    checked: false,
    disabled: false,
    type: "password",
    style: {},
    prepend() {},
    addEventListener() {},
    querySelector() {
      return element();
    }
  };
  return el;
}

const store = new Map();
const sandbox = {
  console,
  document: {
    querySelector() {
      return element();
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return element();
    },
    body: element()
  },
  localStorage: {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  },
  location: { origin: "http://localhost" },
  performance: { now: () => 0 },
  navigator: { clipboard: { writeText: async () => {} } },
  fetch: async () => {
    throw new Error("offline");
  },
  URL,
  Blob,
  setTimeout,
  clearTimeout
};

vm.createContext(sandbox);
try {
  vm.runInContext(match[1], sandbox, { filename: "index.html" });
} catch (error) {
  console.error(`Page script failed to load: ${error.stack || error.message}`);
  process.exit(1);
}

const report = sandbox.runCheckerSelfTest();
if (!report.ok) {
  console.error(`Self-check failed: ${report.failures.length} of ${report.checks}`);
  for (const failure of report.failures) {
    console.error(`- ${failure.id} ${failure.kind}: expected ${failure.expectPass ? "PASS" : "FAIL"} (${failure.note})`);
    if (failure.answer) console.error(`  answer: ${failure.answer}`);
  }
  process.exit(1);
}

console.log(`Self-check passed: ${report.tasks} tasks, ${report.checks} cases (good, bad, wrapped, plus regression cases).`);
