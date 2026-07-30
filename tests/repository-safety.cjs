const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8"
}).split("\0").filter(Boolean);

const forbiddenTrackedFiles = tracked.filter(file => {
  const normalized = file.replaceAll("\\", "/");
  const base = path.posix.basename(normalized);
  if (base === ".env.example") return false;
  return base === ".env" ||
    base.startsWith(".env.") ||
    /(^|\/)(?:exports?|test-results|playwright-report)\//i.test(normalized) ||
    /(^|\/)lunglens-(?:export|data)-.*\.json$/i.test(normalized) ||
    /\.(?:pem|p12|pfx)$/i.test(base);
});
assert.deepEqual(forbiddenTrackedFiles, [],
  `Secret or user-data files must not be tracked: ${forbiddenTrackedFiles.join(", ")}`);

const textExtensions = new Set([
  ".cjs", ".css", ".example", ".html", ".js", ".json", ".md",
  ".mjs", ".ps1", ".txt", ".yaml", ".yml"
]);
const findings = [];
const patterns = [
  {
    name: "private key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
  },
  {
    name: "GitHub token",
    regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/
  },
  {
    name: "long embedded base64 token",
    regex: /["'`](?:[A-Za-z0-9+/]{100,}={0,2})["'`]/
  },
  {
    name: "literal LINE secret",
    regex: /\bLINE_(?:CHANNEL_SECRET|CHANNEL_ACCESS_TOKEN)\s*=\s*["'][^"'$\r\n]{20,}["']/
  },
  {
    name: "unsafe placeholder privacy address",
    regex: /privacy@lunglens\.example/i
  }
];

for (const relative of tracked) {
  const extension = path.extname(relative).toLowerCase();
  if (!textExtensions.has(extension) && path.basename(relative) !== ".gitignore") continue;
  const absolute = path.join(root, relative);
  const text = fs.readFileSync(absolute, "utf8");
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) findings.push(`${relative}: ${pattern.name}`);
  }
}
assert.deepEqual(findings, [], `Repository safety findings:\n${findings.join("\n")}`);

const ignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
for (const required of [
  ".env",
  ".env.*",
  "!.env.example",
  "node_modules/",
  "lunglens-export-*.json",
  "test-results/"
]) {
  assert.ok(ignore.split(/\r?\n/).includes(required), `.gitignore must include ${required}`);
}

const validationWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "validate.yml"),
  "utf8"
);
for (const required of [
  "push:",
  "pull_request:",
  "workflow_dispatch:",
  "contents: read",
  "node --check",
  "tests/*.cjs",
  "git diff --exit-code"
]) {
  assert.ok(validationWorkflow.includes(required), `Validation workflow must include ${required}`);
}
assert.ok(!validationWorkflow.includes("contents: write"),
  "Validation workflow must not have repository write permission");

console.log(`Repository-safety checks passed: ${tracked.length} tracked files, no secret/user-data artifacts or embedded credentials.`);
