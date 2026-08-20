# Log QA đồng bộ CMS → Website

Ngày kiểm tra: 19/08/2026  
Môi trường: `http://localhost:5174`

| Vòng | Thay đổi thử từ CMS | Trang public kiểm tra | Kết quả |
|---|---|---|---|
| 1 | `about.heroTitle` → `QA vòng 1 — Đồng bộ thành công` | `about.html`, tiêu đề Hero | Đạt: trang public hiển thị đúng giá trị mới; đã khôi phục dữ liệu gốc. |
| 2 | `projects.ctaButton` → `QA vòng 2 — Nút đã đồng bộ` | `projects.html`, nút CTA | Đạt: nhãn nút đổi đúng; đã khôi phục dữ liệu gốc. |
| 3 | `footer.description` → `QA vòng 3 — Footer đã đồng bộ` | `privacy.html`, mô tả Footer | Đạt: footer đổi đúng trên trang khác; đã khôi phục dữ liệu gốc. |

## Kiểm tra kỹ thuật bổ sung

- Cú pháp `server.js`, `js/main.js`, `js/admin.js`: đạt.
- API CMS: đăng nhập admin → đọc nội dung → lưu nội dung → đọc xác minh → khôi phục: đạt.
- Dữ liệu nội dung sau QA được khôi phục về giá trị ban đầu.
- Kiểm tra menu/footer sau khi đưa vào CMS: nhãn menu hiển thị đúng, danh sách điểm đến không bị ảnh hưởng.
- CMS nội dung được chia thành các tab: Trang chủ, Về chúng tôi, Dự án, Liên hệ, Điều khoản sử dụng, Chính sách bảo mật, Footer, Tài khoản khách hàng, Chi tiết căn hộ và Menu & thiết lập chung.
- Tại thời điểm kiểm tra, CMS có 107 trường nội dung riêng được đồng bộ từ nội dung website hiện có.

## Ghi chú nghiệm thu

Log này chứng minh luồng dữ liệu bền: CMS ghi vào `data/site-content.json`, website đọc lại qua `/api/content` và hiển thị đúng sau khi tải lại trang.

## QA cuối sau khi hoàn thiện trường chi tiết

| Vòng | Thay đổi thử từ CMS | Trang public kiểm tra | Kết quả |
|---|---|---|---|
| 1 | `home.value1Title` → `QA mới 1 — Khối trang chủ` | `index.html`, thẻ giá trị đầu tiên | Đạt; website đổi sau khi nạp dữ liệu CMS; đã khôi phục. |
| 2 | `projects.step2Title` → `QA mới 2 — Quy trình dự án` | `projects.html`, bước quy trình thứ hai | Đạt; website đổi đúng; đã khôi phục. |
| 3 | `global.navContact` → `QA mới 3 — Liên hệ` | `contact.html`, menu chính | Đạt; nhãn menu đổi đúng; đã khôi phục. |

### Lỗi đã phát hiện và khắc phục

Trong QA, các khóa có số như `home.value1Title` chưa được server chấp nhận khi lưu. Quy tắc kiểm tra dữ liệu đã được sửa để hỗ trợ cả chữ và số. Ba vòng QA cuối xác nhận lỗi đã được xử lý.

### Kiểm tra độ phủ CMS

- 127 trường nội dung được khai báo trong giao diện CMS.
- 127/127 trường có dữ liệu khởi tạo tương ứng trong `data/site-content.json`.
- Không có trường CMS trùng lặp.
