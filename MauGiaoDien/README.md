# MauGiaoDien — 12 mẫu giao diện web app (Apps Script), sidebar trái thu gọn / mở rộng

Chưa gắn dự án Apps Script (chưa có `.clasp.json`). Đây là bộ mẫu để chọn phong cách; dữ liệu là số liệu mẫu.
Truy cập: `<URL>?mau=<khóa hoặc số>` (ví dụ `?mau=nova-glass`, `?mau=02`). Không có `?mau` → trang chọn mẫu.

| Số | Khóa (`?mau=`) | Bộ · Tên | Mô tả ngắn | File chính |
|---|---|---|---|---|
| 01 | `nova-sang` | Nova · Sáng – SaaS | Nền sáng, sidebar trắng, indigo | `NovaSang` + `NovaSangStyle` |
| 02 | `nova-glass` | Nova · Tối – Glass | Nền tối, kính mờ, gradient tím – xanh | `NovaGlass` + `NovaGlassStyle` |
| 03 | `nova-noi` | Nova · Nổi – Bo góc | Sidebar nổi bo tròn, viên thuốc xanh ngọc | `NovaNoi` + `NovaNoiStyle` |
| 04 | `nova-rail` | Nova · Hai lớp – Rail + Panel | Thanh icon tối + panel menu theo nhóm | `NovaRail` + `NovaRailStyle` |
| 05 | `nimbus-light` | Nimbus · Light | Sáng, thoáng, indigo | `NimbusLight` |
| 06 | `nimbus-dark` | Nimbus · Dark | Tối, phẳng, xanh ngọc | `NimbusDark` |
| 07 | `nimbus-aurora` | Nimbus · Aurora | Kính mờ, nền chuyển màu | `NimbusAurora` |
| 08 | `nimbus-ocean` | Nimbus · Ocean | Sidebar navy tương phản, xanh dương | `NimbusOcean` |
| 09 | `nimbus-sunset` | Nimbus · Sunset | Nền kem ấm, bo lớn, cam đất | `NimbusSunset` |
| 10 | `nimbus-mono` | Nimbus · Mono | Đen trắng, viền đậm, bóng cứng | `NimbusMono` |
| 18 | `rieng` | Của tôi · QuanLyTaiChinh | **Mẫu riêng của bạn** — tổng hợp thiết kế đã làm cho app: menu 3 cấp, thanh icon thu gọn, 8 giao diện, 21 màu, 4 cỡ chữ | `Rieng` + `RiengStyle` + `RiengScript` + `RiengIcon` |
| 11 | `nova-module` | Nova · Nhiều module | App 24 module / 6 nhóm: nhóm gập – mở, mục ghim, tìm nhanh Ctrl K; thu gọn = 1 icon mỗi nhóm + flyout | `NovaModule` + `NovaModuleStyle` + `NovaTimNhanh` |

**Nova (01–04):** 4 kiểu sidebar trên cùng một trang nội dung mẫu; bấm menu chỉ đổi tiêu đề.
**Nova 11 (nhiều module)** — mẫu thử cách xử lý sidebar khi app có nhiều module (chưa áp vào app thật): ≤ 2 cấp (nhóm › mục); mỗi nhóm gập / mở và nhớ trạng thái (`mau.nhom`); mục **Ghim** ở đầu (nút ★ ở từng mục, nhớ ở `mau.ghim`); **thu gọn = 1 icon cho mỗi nhóm**, rê chuột / bấm ra flyout liệt kê các mục của nhóm (không xếp cả 24 icon thành cột dài); **Ctrl K** (hoặc bấm ô tìm / nút kính lúp trên điện thoại) mở hộp tìm nhanh: gõ không dấu, ↑ ↓ chọn, Enter mở, Esc đóng, ô trống hiện "Gần đây" (`mau.gan-day`).
**Của tôi (12)** — tổng hợp thiết kế giao diện của app QuanLyTaiChinh trong 1 mẫu chạy độc lập (dữ liệu mẫu, không gọi server):
- **Menu 3 cấp:** đầu mục (nhãn chữ HOA nhỏ tĩnh, không icon, không mũi tên, không đường gạch) → hàng có icon (mục thẳng trong nhóm, hoặc **nhóm con** = nhóm cha có icon + mũi tên; nhóm con gập/mở kiểu accordion — chỉ 1 nhóm con mở, › khi gập / ˅ khi mở, nền viên thuốc khi mở, trượt mượt 220ms như app) → **module chỉ chữ** (không icon; có vạch dẫn dọc, module đang mở = chữ màu chủ đạo + đoạn vạch đậm). Mục riêng + HOME ở đầu, Cài đặt ở chân.
- **Thanh icon (thu gọn):** icon các hàng cấp 2, đầu mục thành **dấu gạch mờ** 26×1px (rê chuột ra tên nhóm), rê / bấm icon nhóm cha ra **flyout** liệt kê module (↑ ↓ Esc), chú giải tên mục. Mục đang mở: menu bung = nền nhạt + vạch 3px bên trái; thanh icon = viên thuốc.
- **8 giao diện** (Mặc định · Sáng · Tối · Dark · Aurora · Ocean · Sunset · Mono) chọn ở trang Cài đặt (nút bánh răng) hoặc nút đổi nhanh trên thanh đầu; chọn giao diện có màu đi kèm thì màu chủ đạo tự đổi theo; **21 màu chủ đạo**, **4 cỡ chữ**, lưu riêng theo trình duyệt (`rieng.*` trong localStorage).
- Công thức màu giống `apGiaoDien_` của app (`RiengScript`: `CHE_DO`, `MAU_CHINH`, `phaMau`, `chuTrenMau`); CSS giao diện trong `RiengStyle` bám `GiaoDien.html` + `Stylesheet.html` của app. Bộ icon `RiengIcon` trích **nguyên văn** từ `ICON_SVG` của app. Đổi thiết kế ở app thì cập nhật mẫu này tay (không tự đồng bộ).
- Menu bên đổi dữ liệu ở `NHOM` / `MUC_RIENG` trong `RiengScript`.

**Nimbus (05–10):** dashboard đầy đủ (Tổng quan, Đơn hàng, Khách hàng, Báo cáo, Cài đặt), dữ liệu lấy qua `google.script.run.getDashboardData()`, chuyển nhanh giữa 6 theme ở thanh trên / trang Cài đặt.
Mọi mẫu đều có lối về trang chọn (Nova: nút "Đổi mẫu"; Nimbus: nút lưới ở thanh trên).

## Cấu trúc (mỗi thứ chỉ định nghĩa 1 chỗ)
- `Code.js` — bảng `MAU` + `BO` (số, khóa, file, tên, mô tả: **nguồn duy nhất** cho định tuyến, tiêu đề tab, trang chọn), `doGet(e)`, `include()`. Thêm mẫu mới = thêm 1 dòng vào `MAU` + file HTML + 1 thẻ hình nhỏ `.anh-<khóa>` trong `Chon.html`.
- `Chon.html` — trang chọn, đọc bảng `MAU` bằng scriptlet.
- **Nova 11:** dữ liệu MENU nằm trong `NovaModule.html` (`window.MENU_MAU`, đọc bởi `NovaSidebarScript` — các mẫu 01–04 không đặt thì dùng MENU mặc định); kiểu menu `data-menu="module"` vẽ nhóm + ghim; `NovaTimNhanh.html` = hộp Ctrl K (dùng `window.NovaSB` do `NovaSidebarScript` đặt, nên gọi `NovaTimNhanh.khoiTao()` SAU script đó); `NovaModuleStyle` = CSS riêng.
- **Của tôi 12:** `Rieng` (trang cấp cao: khung, thanh đầu, vùng nội dung; chỉ nó có scriptlet) · `RiengStyle` (biến màu, khung, menu 3 cấp, thanh icon, flyout, 8 giao diện) · `RiengScript` (dữ liệu menu + toàn bộ logic) · `RiengIcon` (sprite icon tạo từ `ICON_SVG` của app; thiếu icon thì thêm `<symbol id="i-ten">` vào đây).
- **Nova:** `NovaNen` (biến màu, cơ chế sidebar, thẻ, bảng) · `NovaSidebarScript` (**toàn bộ** logic sidebar + dữ liệu `MENU`) · `NovaSidebarHead` (áp trạng thái đã lưu trước lần vẽ đầu) · `NovaIcon` · `NovaNoiDung`.
- **Nimbus:** `NimbusBase` (CSS dùng chung) · `NimbusLayout` (khung + trang) · `NimbusScript` (logic) · `NimbusData.js` (dữ liệu server) · mỗi theme 1 file `Nimbus<Tên>.html` chỉ chứa biến màu + vài ghi đè. Thêm theme: copy 1 theme, đổi biến, thêm thẻ + nút ở `NimbusLayout`, `.sw-<khóa>` ở `NimbusBase`.

## Quy tắc quan trọng của Apps Script
- Scriptlet `<? ?>` / `<?= ?>` **chỉ nằm ở file trang cấp cao** (`Chon`, `Nova*`, `Nimbus*` không có hậu tố `Style`). File được `include()` không được evaluate nên không được chứa `<?`. Cần URL trong file include → dùng `window.APP_BASE` do trang chính đặt.
- Link chuyển mẫu dùng `target="_top"` + URL tuyệt đối (iframe của HtmlService). Trong sidebar Nova chọn mục bằng nút, đổi tiêu đề phía client (không dùng `<a href>`).
- Breakpoint: Nova ≤ 720px, Nimbus ≤ 900px (ngăn kéo + lớp phủ).

## Sidebar
- Thu gọn = cột icon (Nova 72px, Nimbus 80px), hover hiện nhãn; Nova có flyout cho menu con. Trạng thái nhớ trong `localStorage` (Nova: `mau.sidebar`, Nimbus: `sb-collapsed`).
- Điện thoại: ngăn kéo + lớp phủ, nút hamburger, Esc / bấm ra ngoài để đóng. Nút bật/tắt có `aria-expanded` + `aria-label`.

## Xem thử cục bộ
```
node kiem-thu/may-chu-mau.js "<đường dẫn tuyệt đối tới thư mục MauGiaoDien>" 8766
```
Mở `http://localhost:8766/`. Máy chủ chạy chính `doGet` của `Code.js` (xem `kiem-thu/README.md`). Sau khi test: `localStorage.clear()`.
