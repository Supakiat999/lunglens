# LungLens LINE Official Account + เมนูปุ่มกด

Goal: an OA people add as a friend; the chat shows **6 big buttons** (rich menu)
that open each part of the app directly. Everything below is **free**.

## Current live setup — completed 2026-07-26

- Account name: **LungLens**
- Basic ID: `@794hkqhs`
- Category: Health / Health (Other), Thailand
- Messaging API channel: `2010852424`, provider **Longview**
- Auto-response: OFF
- Bilingual greeting: installed
- Bilingual rich menu: installed and set as default
- Public no-login URL: https://supakiat999.github.io/lunglens/

The steps below are retained as a recovery/reinstallation guide. Never commit a channel
secret or access token.

## ขั้นที่ 1 — สร้าง Official Account (ทำเองครั้งเดียว ~3 นาที)

LINE requires a human for this step (Claude's automation is blocked on their
business-signup site, by LINE's design).

1. เปิด **https://manager.line.biz/** (ยืนยันแล้วว่าใช้งานได้ — ลิงก์ `entry.line.biz/start/th/`
   ใช้ไม่ได้แล้ว ขึ้น 404) · หรือทำจากมือถือ: แอป LINE → หน้าหลัก → บริการ → LINE Official Account
2. Log in with the same LINE Business ID you already use for **Stock Report**.
3. Create account:
   - **Account name:** LungLens
   - **Industry:** Health / Medical (หมวดสุขภาพ)
   - Email: your email · everything else default → Create.
4. เสร็จแล้วจะเข้า **LINE Official Account Manager** (manager.line.biz) อัตโนมัติ

## ขั้นที่ 2 — เปิด Messaging API + ออก token (~2 นาที)

1. ใน OA Manager ของบัญชี "LungLens": **Settings (ตั้งค่า) → Messaging API → Enable**
   - เลือก provider: **Longview** (อันเดียวกับ Stock Report)
2. สำคัญ: **Settings → Response settings → Auto-response = OFF** (บทเรียนจาก Stock Report)
3. ไปที่ https://developers.line.biz/console/ → channel "LungLens" (Messaging API)
   → แท็บ **Messaging API** → **Channel access token → Issue** → copy

## ขั้นที่ 3 — ติดตั้งเมนูปุ่มกด (คำสั่งเดียว)

เปิด PowerShell แล้วรัน (ต้องมี Node 18+ · token อยู่กับเจ้าของเท่านั้น ไม่ถูกบันทึกลงไฟล์ใด):

```powershell
cd "C:\Users\ASUS\OneDrive\Desktop\Astra Project\lunglens\line"
$env:LINE_CHANNEL_ACCESS_TOKEN = Read-Host "Paste channel access token"
node setup-richmenu.mjs
Remove-Item Env:LINE_CHANNEL_ACCESS_TOKEN
```

Preferred private prompt on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-richmenu-private.ps1
```

The helper hides the pasted token, keeps it only in the installer process, clears the
environment variable immediately, and zeroes the temporary unmanaged token buffer.

สคริปต์จะสร้างเมนู 6 ปุ่ม (ภาพ `rich-menu.png` — ตัวอักษรใหญ่ อ่านง่ายทุกวัย),
อัปโหลดภาพ และตั้งเป็นเมนูหลักให้ผู้ใช้ทุกคนโดยอัตโนมัติ:

| ปุ่ม | เปิดหน้า |
|---|---|
| ✅ ประเมินความเสี่ยง / Assess risk | แบบประเมิน 2–3 นาที |
| 📊 ผลของฉัน / My result | ผลล่าสุด |
| 📚 ความรู้ / Learn | บทความอ่านง่าย |
| 🏥 สถานพยาบาล / Clinics | ค้นหาใกล้บ้าน |
| 🔔 แจ้งเตือน / Reminders | ตั้งค่าการแจ้งเตือน |
| ❓ ช่วยเหลือ / Help | หน้าความช่วยเหลือ |

(ถ้าอยากทำผ่านหน้าเว็บแทน: OA Manager → Home → Rich menu → Create →
template 3×2 → upload `rich-menu.png` → ใส่ลิงก์ทั้ง 6 ช่องตามตาราง
`https://liff.line.me/2010756823-yiuPlaT0?p=begin|result|education|clinics|profile|help`
→ Chat bar text: **รู้ทันปอด** → Save + Display)

## ขั้นที่ 4 — ข้อความต้อนรับ (แนะนำ)

OA Manager → **Greeting message** ใส่:

> Welcome to LungLens
> Review your lung-health factors in 2–3 minutes. This awareness tool is not a diagnosis.
> No LINE login required: https://supakiat999.github.io/lunglens/
>
> ยินดีต้อนรับสู่ LungLens
> ทบทวนปัจจัยสุขภาพปอดของคุณใน 2–3 นาที เครื่องมือนี้ไม่ใช่การวินิจฉัยโรค

## เช็กลิสต์ความปลอดภัย

- Token เก็บเป็น env var เท่านั้น — ห้าม commit
- Auto-response OFF เสมอ (จะแย่ง reply token เมื่อทำ webhook ใน Phase 2)
- chatBarText ยาวได้ไม่เกิน 14 ตัวอักษร ("รู้ทันปอด" = 9 ✓)
- ฟรีทั้งหมด: OA ฟรี · rich menu ฟรี · LIFF เปิดจากปุ่มฟรี (ไม่กิน quota push)
