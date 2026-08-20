# Nhật ký QA — Đặt phòng, chuyển khoản và hủy đơn

Ngày kiểm thử: 20/08/2026  
Môi trường: bản sao local cô lập, cùng commit với staging (`daf5802`). Không có tiền thật được chuyển.

| Hạng mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| Tạo tài khoản staging không cần OTP | Đạt | Biến `ALLOW_UNVERIFIED_SIGNUP=true`; tài khoản QA nhận session ngay sau đăng ký. |
| Tạo yêu cầu đặt phòng | Đạt | Booking test tạo ở trạng thái `pending`. |
| Hiển thị thông tin chuyển khoản/QR | Đạt | `GET /api/payment-config` trả QR và thông tin tài khoản STAGING. |
| Bắt buộc có ảnh biên lai | Đạt | Gửi yêu cầu không có ảnh bị từ chối HTTP 400. Nút trên giao diện cũng bị khóa cho tới khi chọn JPG/PNG/WebP hợp lệ. |
| Gửi ảnh biên lai | Đạt | Booking chuyển sang `payment_submitted`; thanh toán là `proof_submitted`. |
| Trang “Đặt phòng của tôi” | Đạt | Khách chỉ xem được booking của chính mình qua `GET /api/me/bookings`. |
| Khách hủy booking đã gửi biên lai | Đạt | Booking chuyển `cancelled`; thanh toán chuyển `refund_review`. Ngày đặt được giải phóng khỏi availability. |
| Khách hủy booking chưa gửi biên lai | Đạt | Booking chuyển `cancelled`; thanh toán chuyển `cancelled`. |
| Nhật ký hệ thống | Đạt | Audit log ghi đủ `booking.created`, `payment.proof_submitted`, `booking.cancelled_by_customer`, kèm thời gian, mã booking, actor và trạng thái trước/sau. |

## Bước còn lại trên staging public

Lưu hai biến Render đã được nhập sẵn: `ADMIN_AUTH_DISABLED=true` và `ALLOW_UNVERIFIED_SIGNUP=true`. Sau khi service redeploy, lặp lại ca QA trên `https://ssens-homes-demo.onrender.com` để có log production/staging thực tế.
