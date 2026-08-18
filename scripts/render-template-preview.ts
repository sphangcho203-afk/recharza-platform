// Render the live premium email templates to static HTML previews for inspection.
process.env.NEXT_PUBLIC_APP_URL =
  "https://recharza-platform-2o3wxy8mj-stand-still.vercel.app";

// Mock the server-only guard so pure template rendering works offline.
import Module from "node:module";
const origResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === "server-only") return require.resolve("./server-only-shim");
  return origResolve.call(this, request, parent, isMain, options);
};

import "dotenv/config";
import fs from "fs";
import path from "path";
fs.writeFileSync(
  path.resolve("./server-only-shim.js"),
  "module.exports = {};"
);
import { renderEmail } from "@/lib/transactional-email";
import type { LifecycleEmailInput } from "@/lib/lifecycle-email";

// Transactional preview (signup style)
const tx = renderEmail({
  kind: "ACCOUNT_CREATED",
  to: "preview@example.com",
  subject: "Recharza — Welcome",
  eyebrow: "Account created",
  title: "Welcome to Recharza.",
  message:
    "Your account is ready. You can now top up any supported game, track your orders, and reach support from one place.",
  details: [
    { label: "Email", value: "phangchosongja02@gmail.com" },
    { label: "Created", value: "Aug 18, 2026 · 2:52 PM IST" },
  ],
  action: { label: "Open my account", url: "https://recharza-platform-2o3wxy8mj-stand-still.vercel.app/account" },
  footer: "Questions? Reach support from your account dashboard.",
});
fs.writeFileSync("/tmp/preview-transactional.html", tx);
console.log("transactional preview saved, len:", tx.length);

// Lifecycle preview (login security style) — reuse renderHtml via dynamic import of the module internals
async function renderLifecyclePreview() {
  const mod = await import("@/lib/lifecycle-email");
  // renderHtml is not exported; render a minimal lifecycle email using the public send and capture is not possible offline.
  // Instead, read the module source to extract the html builder for preview only.
  const src = fs.readFileSync(require.resolve("@/lib/lifecycle-email"), "utf8");
  // Locate the renderHtml function body boundaries and evaluate a wrapper.
  const start = src.indexOf("function renderHtml(input: LifecycleEmailInput) {");
  const closeIdx = findMatchingBrace(src, start + start.length - 1);
  const body = src.slice(start + src.indexOf("{", start), closeIdx + 1);
  const before = src.slice(0, start + src.indexOf("{", start));
  // Keep helpers: logoUrl, escapeHtml, formatTimestamp and tone map definitions needed by renderHtml.
  const neededBefore = before.slice(before.lastIndexOf("function escapeHtml"), start + src.indexOf("{", start));
  const wrapper = `
    function logoUrl() { return "https://recharza-platform-2o3wxy8mj-stand-still.vercel.app/assets/brand/recharza-line-electric-mark.png"; }
    ${neededBefore}
    ${body}
    module.exports = renderHtml;
  `;
  fs.writeFileSync("/tmp/lifecycle-render.js", wrapper);
  return wrapper;
}

function findMatchingBrace(src: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return src.length - 1;
}

renderLifecyclePreview().then(async () => {
  const { execSync } = await import("child_process");
  execSync("node -e \"global.renderHtml = require('/tmp/lifecycle-render.js'); const html = global.renderHtml({to:'preview@example.com',subject:'x',eyebrow:'New sign-in',title:'A sign-in to your Recharza account',message:'A sign-in was detected from a recognized device. If this was you, no action is needed.',tone:'security',details:[{label:'Device',value:'Android · Chrome'},{label:'Location',value:'India'},{label:'Time',value:'Aug 18, 2026 · 2:52 PM IST'}],idempotencyKey:'preview'}); require('fs').writeFileSync('/tmp/preview-lifecycle.html', html); console.log('lifecycle preview saved, len:', html.length);\"", { stdio: "inherit" });
});
