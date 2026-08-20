# HANDOFF — S.Sens Homes website (bàn giao cho AI khác)

> Dán toàn bộ file này vào AI mới (ChatGPT/Gemini/Claude…) làm ngữ cảnh mở đầu,
> rồi mở thư mục `c:\Users\dell\Desktop\trad\ssens-homes` cho nó đọc code trực tiếp.

## Dự án là gì
Website HTML/CSS/JS thuần với Node.js booking API (**không build step**) cho thương hiệu lưu trú
boutique "S.Sens Homes". Clone từ https://www.ssenshomes.com/accomodation, dựng
lại từ đầu. Chạy bằng Node.js server:

```bash
cd ssens-homes
node server.js   # mở http://127.0.0.1:5173/index.html
```

## Cấu trúc
```
ssens-homes/
├── index.html        # Trang chủ + listing (filter, search, phân trang)
├── about.html  projects.html  contact.html
├── property.html     # Trang chi tiết phòng + BOOKING CORE (lịch + giá)
├── css/style.css     # design system (cream/forest/tan, serif Cormorant + Inter)
├── js/data.js        # dữ liệu phòng (SSENS_PROPERTIES) + SSENS_CONFIG (phí/giảm giá/Telegram)
├── js/booking-engine.js  # lịch chọn ngày + tính giá + chặn ngày đã đặt
├── js/main.js        # header/footer dùng chung, modal đặt phòng, engine listing
├── server.js          # API booking/lịch trống + adapter email Resend
├── data/bookings.json # nơi lưu booking local (tạm thời)
├── docs-sheet/*.csv  # 7 tab của Google Sheet spec mới nhất (bản kế hoạch)
└── assets/img/       # ảnh lưu local
```

## Đã làm xong (state hiện tại)
- Toàn bộ trang tĩnh (home/listing/about/projects/contact/property) — hoàn chỉnh, responsive.
- **Booking core có backend nhẹ (Node.js + JSON file):**
  - Lịch chọn khoảng ngày (click check-in → check-out, chặn ngày quá khứ).
  - Bảng giá minh bạch: `giá đêm × số đêm` → giảm dài ngày (≥7 đêm −10% tuần,
    ≥28 đêm −20% tháng) → phí dọn + phí dịch vụ 8% + thuế 8% → tổng.
    Giá đêm cơ bản = `priceMin` của mỗi phòng.
  - `Instant Book` → tạo booking `confirmed`; `Request to Book` → tạo booking `pending`.
  - API chặn khoảng ngày trùng với booking `pending` hoặc `confirmed`; lịch hiển thị ngày đã chặn.
  - Email xác nhận khách + thông báo chủ nhà qua Resend khi cấu hình `.env`.
- QA đã verify end-to-end bằng jsdom: lịch, giá, giảm giá, gửi form đều PASS.

## Đã sửa 2 bug thật (đừng để tái phát)
1. `main.js` từng gán `window.SSENS = {…}` đè mất `window.SSENS.Booking`.
   → Phải luôn dùng `Object.assign(window.SSENS || {}, {…})`.
2. `form.name` trong JS trả về thuộc tính name của thẻ `<form>`, KHÔNG phải ô input.
   → Luôn truy cập field qua `form.elements['name']`, không dùng `form.name`.

## Cảnh báo bảo mật
Bot token Telegram để trong `data.js` sẽ **lộ trong source trang** (static site).
Muốn an toàn thật thì phải proxy việc gửi qua một server nhỏ, không nhúng token ở client.

## Việc CÒN LẠI (theo Google Sheet spec mới nhất — user chọn "làm lõi trước")
Sheet mới đổi phạm vi từ web trưng bày → web đặt phòng THẬT. Luồng booking cơ bản
đã xong; các phần GIỮ chưa làm, làm khi user yêu cầu:
- Tài khoản khách (đăng ký/đăng nhập, lịch sử đặt).
- PostgreSQL thay cho `data/bookings.json` và trang admin để duyệt/từ chối Request to Book.
- Thanh toán online (cổng thanh toán).
- Trang quản trị (admin) quản lý phòng/đơn.
Các phần này cần backend + database, không thể chỉ static.

## Thông tin phiên Claude Code cũ (nếu cần tra cứu)
Transcript gốc: `C:\Users\dell\.claude\projects\c--Users-dell-Desktop-trad\720f3c32-c917-4e82-86c1-26cd3ac40922.jsonl`
