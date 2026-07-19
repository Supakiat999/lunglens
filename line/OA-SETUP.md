# สร้าง LINE Official Account "รู้ทันปอด" + เมนูปุ่มกด

Goal: an OA people add as a friend; the chat shows **6 big buttons** (rich menu)
that open each part of the app directly. Everything below is **free**.

## ขั้นที่ 1 — สร้าง Official Account (ทำเองครั้งเดียว ~3 นาที)

LINE requires a human for this step (Claude's automation is blocked on their
business-signup site, by LINE's design).

1. เปิด https://entry.line.biz/start/jp/ (หรือค้นหา "LINE Official Account สมัคร")
2. Log in with the same LINE Business ID you already use for **Stock Report**.
3. Create account:
   - **Account name:** รู้ทันปอด
   - **Industry:** Health / Medical (หมวดสุขภาพ)
   - Email: your email · everything else default → Create.
4. เสร็จแล้วจะเข้า **LINE Official Account Manager** (manager.line.biz) อัตโนมัติ

## ขั้นที่ 2 — เปิด Messaging API + ออก token (~2 นาที)

1. ใน OA Manager ของบัญชี "รู้ทันปอด": **Settings (ตั้งค่า) → Messaging API → Enable**
   - เลือก provider: **Longview** (อันเดียวกับ Stock Report)
2. สำคัญ: **Settings → Response settings → Auto-response = OFF** (บทเรียนจาก Stock Report)
3. ไปที่ https://developers.line.biz/console/ → channel ใหม่ "รู้ทันปอด" (Messaging API)
   → แท็บ **Messaging API** → **Channel access token → Issue** → copy

## ขั้นที่ 3 — ติดตั้งเมนูปุ่มกด (คำสั่งเดียว)

PowerShell ในโฟลเดอร์ `lunglens/line/`:

```powershell
$env:LINE_CHANNEL_ACCESS_TOKEN = "<วาง token ตรงนี้>"
node setup-richmenu.mjs
```

สคริปต์จะสร้างเมนู 6 ปุ่ม (ภาพ `rich-menu.png` — ตัวอักษรใหญ่ อ่านง่ายทุกวัย),
อัปโหลดภาพ และตั้งเป็นเมนูหลักให้ผู้ใช้ทุกคนโดยอัตโนมัติ:

| ปุ่ม | เปิดหน้า |
|---|---|
| ✅ ประเมินความเสี่ยง | แบบประเมิน 2–3 นาที |
| 📊 ผลของฉัน | ผลล่าสุด |
| 📚 ความรู้ | บทความอ่านง่าย |
| 🏥 สถานพยาบาล | ค้นหาใกล้บ้าน |
| 🔔 แจ้งเตือน | ตั้งค่าการแจ้งเตือน |
| ❓ ช่วยเหลือ | หน้าแรก |

(ถ้าอยากทำผ่านหน้าเว็บแทน: OA Manager → Home → Rich menu → Create →
template 3×2 → upload `rich-menu.png` → ใส่ลิงก์ทั้ง 6 ช่องตามตาราง
`https://liff.line.me/2010756823-yiuPlaT0?p=begin|result|education|clinics|profile|home`
→ Chat bar text: **รู้ทันปอด** → Save + Display)

## ขั้นที่ 4 — ข้อความต้อนรับ (แนะนำ)

OA Manager → **Greeting message** ใส่:

> ยินดีต้อนรับสู่รู้ทันปอด 🫁
> "ไม่สูบ ไม่ได้แปลว่าไม่เสี่ยง"
> แตะปุ่ม ✅ ประเมินความเสี่ยง ด้านล่าง เพื่อเช็กปัจจัยของคุณใน 2–3 นาที
> (แบบประเมินนี้ไม่ใช่การวินิจฉัยโรค)

## เช็กลิสต์ความปลอดภัย

- Token เก็บเป็น env var เท่านั้น — ห้าม commit
- Auto-response OFF เสมอ (จะแย่ง reply token เมื่อทำ webhook ใน Phase 2)
- chatBarText ยาวได้ไม่เกิน 14 ตัวอักษร ("รู้ทันปอด" = 9 ✓)
- ฟรีทั้งหมด: OA ฟรี · rich menu ฟรี · LIFF เปิดจากปุ่มฟรี (ไม่กิน quota push)
