/* =====================================================================
   LungLens — one-shot rich menu installer for the LINE Official Account.

   Creates the 6-button rich menu (image: rich-menu.png), uploads it,
   and sets it as the default menu for everyone who adds the OA.

   Usage (PowerShell) — paste your own token, Claude never handles it:
     $env:LINE_CHANNEL_ACCESS_TOKEN = "<long-lived token from OA's Messaging API channel>"
     node setup-richmenu.mjs

   Requires Node 18+ (built-in fetch). Token comes from:
   LINE Developers Console -> (your new OA's Messaging API channel)
   -> Messaging API tab -> Channel access token -> Issue.
   ===================================================================== */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Set LINE_CHANNEL_ACCESS_TOKEN first (see header of this file). Token is never stored.");
  process.exit(1);
}

const LIFF = "https://liff.line.me/2010756823-yiuPlaT0";
const W = 2500, H = 1686, TW = 833, TH = 843;

const routes = ["begin", "result", "education", "clinics", "profile", "home"];
const areas = routes.map((p, i) => {
  const c = i % 3, r = Math.floor(i / 3);
  return {
    bounds: { x: c * TW, y: r * TH, width: c === 2 ? W - 2 * TW : TW, height: TH },
    action: { type: "uri", label: p, uri: `${LIFF}?p=${p}` }
  };
});

const menu = {
  size: { width: W, height: H },
  selected: true,               // menu opens by default — easiest for elders
  name: "lunglens-main-v1",
  chatBarText: "รู้ทันปอด",      // <= 14 chars (hard LINE limit)
  areas
};

const api = (host, path, opts = {}) =>
  fetch(`https://${host}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) }
  }).then(async r => {
    const body = await r.text();
    if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}: ${body}`);
    return body ? JSON.parse(body) : {};
  });

const here = dirname(fileURLToPath(import.meta.url));

// 1) create menu
const { richMenuId } = await api("api.line.me", "/v2/bot/richmenu", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(menu)
});
console.log("Created rich menu:", richMenuId);

// 2) upload image
const png = await readFile(join(here, "rich-menu.png"));
await api("api-data.line.me", `/v2/bot/richmenu/${richMenuId}/content`, {
  method: "POST",
  headers: { "Content-Type": "image/png" },
  body: png
});
console.log("Uploaded rich-menu.png");

// 3) set as default for all users
await api("api.line.me", `/v2/bot/user/all/richmenu/${richMenuId}`, { method: "POST" });
console.log("Set as default menu. Done — open the OA chat on your phone to see the buttons.");
