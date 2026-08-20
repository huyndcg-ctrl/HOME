# QA hành trình khách hàng — 20/08/2026

## Kết quả tự động

Chạy lệnh `npm run qa:customer` trên môi trường cô lập cùng mã nguồn hiện tại: **10/10 PASS**.

| # | Kịch bản khách hàng | Kết quả |
| --- | --- | --- |
| 1 | Mở trang chủ, trang chi tiết căn, trang tài khoản | PASS |
| 2 | Nhận cấu hình QR/thông tin chuyển khoản | PASS |
| 3 | Cố đặt phòng khi chưa đăng nhập | PASS — chặn 401 |
| 4 | Tạo tài khoản ở staging (không OTP) | PASS |
| 5 | Tạo yêu cầu đặt phòng | PASS — `pending` |
| 6 | Xác nhận chuyển khoản không có ảnh biên lai | PASS — chặn 400 |
| 7 | Gửi ảnh biên lai hợp lệ | PASS — `payment_submitted` |
| 8 | Tài khoản khác thử hủy đơn không thuộc mình | PASS — chặn 404 |
| 9 | Khách mở “Đặt phòng của tôi” | PASS — chỉ thấy đơn của chính mình |
| 10 | Khách hủy đơn sau khi gửi biên lai | PASS — `cancelled`, `refund_review`, lịch được mở, audit đủ |

## Hành vi hiện tại

1. Khách chọn căn, ngày và số khách; nếu chưa đăng nhập sẽ được chuyển sang trang tài khoản.
2. Sau khi tạo booking, màn hình hiển thị QR, ngân hàng, số tài khoản, chủ tài khoản và mã chuyển khoản.
3. Nút “Tôi đã chuyển khoản — gửi xác nhận” chỉ bật sau khi chọn ảnh JPG/PNG/WebP tối đa 4 MB. Server cũng chặn nếu không có ảnh.
4. Khi gửi ảnh, trạng thái booking là `payment_submitted`. Admin xem chứng từ và xác nhận thủ công.
5. Mỗi khách chỉ thấy booking của chính mình ở “Chuyến ở của tôi”.
6. Khách bấm hủy: booking là `cancelled`; nếu đã gửi ảnh thì thanh toán là `refund_review`, nếu chưa gửi ảnh thì là `cancelled`. Lịch trống lại ngay.
7. Audit log lưu `booking.created`, `payment.proof_submitted`, `booking.cancelled_by_customer`, kèm thời gian, người thao tác và trạng thái liên quan.

## Kiểm tra public hiện tại

- Các trang public và ảnh tải được, chi tiết căn hiển thị đủ hình/tiện nghi/quy định.
- Đăng ký trên URL public hiện trả **503** vì chưa cấu hình Resend và chưa bật chế độ staging không OTP.
- Admin trên URL public vẫn yêu cầu mật khẩu; đây là an toàn hơn việc tắt mật khẩu cho site đang public.

## Đánh giá sẵn sàng

**Sẵn sàng để demo luồng đặt phòng/chuyển khoản trên môi trường staging cô lập. Chưa sẵn sàng nhận khách thật.**

Các điều kiện trước khi mở cho khách thật:

1. Dùng database bền vững (Postgres/Supabase/Neon), thay cho các file JSON trong ổ đĩa Render vì dữ liệu có thể mất khi redeploy/restart.
2. Cấu hình Resend + domain gửi mail đã xác minh, để khách tự xác thực OTP.
3. Tạo staging riêng; không tắt mật khẩu admin trên URL public/production.
4. Thay QR STAGING, ngân hàng, số tài khoản và chủ tài khoản bằng thông tin thật trong CMS.
5. Thiết lập quy trình admin kiểm tra biên lai, xác nhận booking và xử lý hoàn tiền khi khách hủy sau chuyển khoản.
