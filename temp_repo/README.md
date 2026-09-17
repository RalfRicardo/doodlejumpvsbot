# Doodle Jump USTH

Bộ khung **V0.0** cho nhóm bắt đầu làm game web bằng **ReactJS + Canvas + Python Flask**.

Repo chung: [2D_Doodle_Jump_Web_Project](https://github.com/haohan233-tvinh/2D_Doodle_Jump_Web_Project).

## Bắt đầu ở đâu?

1. Đọc [Hướng dẫn bắt đầu](docs/START_HERE.md).
2. Chạy dự án và thấy nhân vật màu vàng đứng trên bệ.
3. Mở [Việc đầu tiên của từng người](docs/FIRST_TASKS.md), tìm tên mình.
4. Chỉ làm nhiệm vụ đầu tiên, chưa làm hết tính năng trong kế hoạch.

## Chạy trên Windows

Cần **Node.js 24 LTS**, **Python 3.12** (có lệnh `py`), **Git** và **VS Code**.
Mở PowerShell tại thư mục này, chạy:

```powershell
npm.cmd run setup
npm.cmd run dev
```

Mở **http://localhost:5173**. Giữ terminal đang chạy. Nhấn **Ctrl+C** để dừng hai dịch vụ.

Lần sau chỉ cần `npm.cmd run dev`. Sau khi đồng đội đổi thư viện, chạy lại setup.
Frontend tự cập nhật khi lưu file; sau khi sửa Python, dừng dev rồi chạy lại.

## Bộ khung có gì?

| Đã chạy được | Nhóm sẽ triển khai |
|---|---|
| Một màn hình game React + Canvas | Di chuyển, nhảy, va chạm, camera |
| Flask `/api/health` và `/api/config` | Mô phỏng 4 ghost bot và xếp hạng |
| Proxy Vite nối frontend với backend | Form nickname/skin và vòng đời lượt |
| Schema SQLite, init không xóa dữ liệu | Lưu kết quả, lịch sử, bảng xếp hạng |
| Test khung và hướng dẫn từng người | Bộ test gameplay và nghiệp vụ |

Canvas hiện là **hình tĩnh**, chưa phải game chơi được. API kết quả trả **501 chưa triển khai**, không giả báo đã lưu.

## Các thư mục

- `frontend/src/pages/`: màn hình React.
- `frontend/src/components/`: thành phần giao diện.
- `frontend/src/game/`: code game chạy trong trình duyệt.
- `backend/routes/`: route Flask.
- `backend/schema.sql`: cấu trúc dữ liệu dự kiến.
- `docs/`: hướng dẫn, công việc đầu tiên và quy ước API.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run build
```

`build` kiểm tra frontend đóng gói được; chưa phải triển khai website hoàn chỉnh.
Quy trình nhóm: **branch từ dev → làm một việc → tự kiểm tra → gửi trưởng nhóm → ghép và kiểm tra bản chung → merge vào dev**.
Mỗi người dùng [quy ước chung](docs/QUY_UOC_CHUNG.md), không cần kiểm tra chéo hay trao đổi thường xuyên với thành viên khác.
Không đưa thư viện, `.venv`, cơ sở dữ liệu hay slide giảng viên vào Git.

Danh sách nhóm hiện có 7 người; cần xác nhận với giảng viên vì slide ghi tối đa 6.
Sau lần tải mã nguồn đầu tiên lên `main`, trưởng nhóm tạo nhánh `dev` từ `main` nếu chưa có và mời các thành viên vào repo.
