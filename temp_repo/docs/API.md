# Quy ước API

Frontend gọi đường dẫn tương đối `/api/...`; Vite chuyển tới Flask :3000 khi phát triển.

## Đang hoạt động ở V0.0

- `GET /api/health` → 200, `{status, service, version}`.
- `GET /api/config` → 200, `{rules_version, finish_height, max_duration_ms, skins, bots}`.
- `flask --app backend.app init-db` tạo bảng còn thiếu, không xóa bản ghi cũ.

## Đã đặt route nhưng chưa có nghiệp vụ

Các route sau **đang trả 501**. Bảng này là mục tiêu để thành viên triển khai, không phải mô tả tính năng đã hoàn thành.

| Route | Kết quả mục tiêu |
|---|---|
| POST /api/runs | 201 khi tạo; 200 khi cùng ID/cùng nội dung; 409 nếu ID cũ nhưng dữ liệu khác |
| GET /api/runs?player_id=UUID | 200 `{items: [...]}`, 20 lượt mới nhất của khách; tham số thiếu/sai trả 422 |
| GET /api/runs/:run_id | 200 bản ghi, 404 nếu không có |
| GET /api/leaderboard?rules_version=v1 | 200 `{items: [...]}`, top 10 lượt của người thật theo phiên bản luật |

GET `/api/runs` lọc đúng `player_id`, sắp `created_at` giảm dần; nếu bằng nhau thì `run_id` tăng dần, rồi lấy tối đa 20 lượt. Không có dữ liệu trả `{items: []}`. Mã người chơi thiếu hoặc không phải UUID hợp lệ trả 422. Dùng truy vấn SQL có tham số và cơ sở dữ liệu tạm khi kiểm tra.

POST nhận `run_id`, `player_id` (UUID), `nickname` (trim, 1–24 ký tự), `skin_id`, `rules_version`, `height`, `elapsed_ms`, `outcome` (`finished` hoặc `dnf`), `placement` (1–5). Server tạo `created_at` UTC.

Độ cao 0 đến finish_height; finished phải đạt đích, dnf chưa đạt đích. elapsed_ms nguyên >0 và <= max_duration_ms. Không nhận boolean thay số nguyên. Kiểm tra skin/luật trong danh sách cho phép.

JSON sai cú pháp: 400. JSON đọc được nhưng sai kiểu/giá trị: 422. Sai phương thức: 405. Lỗi bất ngờ: 500 không trả traceback. Mọi lỗi có dạng:

```json
{"error": {"code": "invalid_run", "message": "Dữ liệu chưa hợp lệ.", "details": {"height": "ngoài phạm vi"}}}
```

Bảng chung: finished đứng trước dnf; finished theo elapsed_ms tăng dần; dnf theo height giảm dần rồi elapsed_ms tăng dần; hòa theo created_at rồi run_id. Cho phép nhiều lượt của một người. Không lưu bot thành bản ghi người chơi.

player_id lưu ở trình duyệt chỉ là định danh khách, không phải tài khoản xác thực. Kết quả client báo chưa chống gian lận. SQLite hiện là lựa chọn dự án, không phải tính năng được Flask tự cung cấp.
