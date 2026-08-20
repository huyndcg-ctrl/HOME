# Public demo trên Render

## Mục tiêu

Tạo một link công khai để khách xem website và bạn đăng nhập CMS bằng mật khẩu.

> Đây là bản demo. Dữ liệu phát sinh trong CMS, booking, lead và ảnh upload có thể mất sau khi Render khởi động lại hoặc deploy mới, vì hiện hệ thống lưu dữ liệu bằng file. Không dùng bản này để nhận booking thật.

## 1. Đưa source lên GitHub

1. Tạo một repository **Private** mới trên GitHub, ví dụ `ssens-homes`.
2. Trong thư mục dự án, chạy các lệnh sau:

```powershell
git init
git add .
git commit -m "Prepare public demo"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB_CUA_BAN/ssens-homes.git
git push -u origin main
```

File `.env`, dữ liệu khách và booking sẽ không được đẩy lên GitHub.

## 2. Tạo website public ở Render

1. Đăng nhập [Render](https://render.com).
2. Chọn **New** → **Blueprint**.
3. Kết nối GitHub, chọn repository `ssens-homes` và nhánh `main`.
4. Render tự đọc file `render.yaml`; bấm **Apply**.
5. Mở service `ssens-homes-demo`, vào **Environment** và đặt:

| Biến | Giá trị |
|---|---|
| `ADMIN_AUTH_DISABLED` | `false` |
| `ADMIN_PASSWORD` | Mật khẩu admin mới, đủ mạnh |
| `OWNER_EMAIL` | Email nhận thông báo booking |
| `RESEND_API_KEY` | Để trống ở bản demo nếu chưa cấu hình Resend |
| `RESEND_FROM` | Để trống ở bản demo nếu chưa cấu hình Resend |

6. Bấm **Manual Deploy** → **Deploy latest commit**.
7. Khi trạng thái là *Live*, Render cấp URL dạng `https://ssens-homes-demo.onrender.com`.

## 3. Kiểm tra sau deploy

- Mở trang chủ bằng link Render.
- Mở `/admin.html`, đăng nhập bằng `ADMIN_PASSWORD` vừa đặt.
- Kiểm tra trang căn hộ, form yêu cầu và phần CMS.
- Không thử đăng ký/OTP nếu Resend chưa cấu hình.

## 4. Sau khi demo được duyệt

Chuyển CMS, booking, khách hàng và ảnh upload sang Supabase trước khi nhận booking thật. Khi đó dữ liệu sẽ không mất lúc Render redeploy.
