# Lịch Desktop — Modular Personal Calendar & Life-OS App

## Overview

Xây dựng ứng dụng Desktop đa năng (**Lịch Desktop**) trên nền tảng **Electron + React + TypeScript**, lấy **Lịch & Sự kiện** làm trung tâm và mở rộng linh hoạt qua **kiến trúc Module bật/tắt** gồm:
1. **Calendar & Events** (Ngày / Tuần / Tháng / Lịch biểu, lặp lại, nhắc nhở hệ thống)
2. **Vietnamese Lunar Calendar & Countdown** (Âm lịch song song Dương lịch, ngày lễ/giỗ Âm lịch, đếm ngược sự kiện)
3. **Tasks, Habits & Pomodoro** (To-do gắn ngày, theo dõi thói quen hằng ngày, bộ đếm Pomodoro)
4. **Daily Notes & Mood Journal** (Ghi chú Markdown theo ngày, nhật ký tâm trạng)
5. **Personal Finance & Goals** (Ghi chép thu chi theo ngày, mục tiêu cá nhân & tiến độ)
6. **Floating Desktop Widget & System Tray** (Widget ghim nổi ngoài màn hình xem nhanh lịch + việc hôm nay, chạy nền khay hệ thống & thông báo native Windows)
7. **Offline-First + Cloud Sync** (Làm việc tức thì ở chế độ Offline/Local, đồng bộ đa thiết bị khi đăng nhập tài khoản Cloud)

## Project Type

- **DESKTOP** (`electron-vite` — Electron + React 19 + TypeScript + Tailwind CSS v4) + **Cloud Backend** (Supabase Auth + PostgreSQL + Realtime Sync)

## Success Criteria

- [x] App khởi chạy mượt trên Windows (`npm run dev` & `npm run build` thành công không lỗi TypeScript/ESLint).
- [x] Kiến trúc **Module Registry** cho phép bật/tắt từng module ngay trong Cài đặt, thanh điều hướng & giao diện cập nhật tức thì mà không ảnh hưởng dữ liệu.
- [x] Lịch hiển thị chính xác **Dương lịch + Âm lịch Việt Nam** (thuật toán Hồ Ngọc Đức), tạo/sửa/xóa sự kiện (kể cả sự kiện lặp theo Dương lịch & Âm lịch) và gửi thông báo Windows đúng giờ.
- [x] **Floating Desktop Widget** mở/đóng từ Main App hoặc System Tray, kéo thả vị trí (tự nhớ tọa độ), hỗ trợ ghim nổi (Always-on-top), check hoàn thành To-do & xem sự kiện hôm nay đồng bộ thời gian thực với Main Window.
- [x] Đủ 5 nhóm module hoạt động thực tế (Tasks/Habits/Pomodoro, Lunar/Countdown, Daily Notes/Mood, Finance/Goals, Module Manager) với dữ liệu lưu bền vững cục bộ (IndexedDB/Dexie) và đồng bộ Cloud (Supabase) khi đăng nhập.
- [x] Bảo mật Electron đạt chuẩn: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, IPC khai báo type-safe qua `contextBridge`.

## Tech Stack

| Thành phần | Công nghệ | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Desktop Shell** | Electron + `electron-vite` + `electron-builder` | Chuẩn 2026 cho desktop đa nền tảng, tách biệt rõ `main / preload / renderer`, hỗ trợ multi-window (Main + Floating Widget) & System Tray. |
| **UI & Styling** | React 19 + TypeScript + Tailwind CSS v4 + `@phosphor-icons/react` | Component tái sử dụng cao, styling nhanh, nhẹ, nhất quán theo design tokens. |
| **State & Routing** | Zustand (Client/Module state) + Hash-based multi-entry (`main.html`, `widget.html`) | Nhẹ, hỗ trợ đồng bộ state giữa Main Window và Widget qua Electron IPC. |
| **Local Storage (Offline-First)** | Dexie.js (IndexedDB) + `electron-store` (settings/window bounds) | **Không cần native C++ build tools / Python trên Windows**, tốc độ đọc/ghi tức thì, hỗ trợ query ngày/tháng mạnh. |
| **Cloud Sync & Auth** | Supabase (`@supabase/supabase-js`: Auth + PostgreSQL + RLS + Realtime) | Triển khai nhanh Cloud Sync đa thiết bị, có tầng Sync Engine tách biệt để chạy mượt kể cả khi chưa cấu hình `.env` (Guest/Offline mode). |
| **Lunar Calendar Engine** | Module TypeScript thuần (thuật toán Hồ Ngọc Đức, múi giờ UTC+7) | Chính xác 100% Âm lịch Việt Nam, không phụ thuộc thư viện lỗi thời hay API mạng. |
| **Validation & Testing** | Zod + Vitest + React Testing Library | Kiểm tra schema dữ liệu đồng bộ an toàn, unit test logic Âm lịch, lặp sự kiện & sync queue. |

## File Structure

```text
Lich-Desktop/
├── lich-desktop-app.md              # Kế hoạch tổng thể (file này)
├── DESIGN.md                        # Design tokens & hệ thống giao diện (Phase 3)
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── supabase/
│   └── schema.sql                   # PostgreSQL schema + Row Level Security (RLS)
├── src/
│   ├── main/                        # Electron Main Process
│   │   ├── index.ts                 # App lifecycle, single-instance lock
│   │   ├── windows/
│   │   │   ├── mainWindow.ts        # Cửa sổ chính
│   │   │   └── widgetWindow.ts      # Floating Desktop Widget (frameless, draggable, pin)
│   │   ├── tray.ts                  # System Tray + context menu
│   │   ├── notifications.ts         # Native Windows reminder scheduler
│   │   ├── store.ts                 # electron-store (bounds, widget config, enabled modules)
│   │   └── ipc.ts                   # Type-safe IPC handlers + Main<->Widget state broadcast
│   ├── preload/                     # Secure contextBridge surface
│   │   ├── index.ts
│   │   └── index.d.ts
│   ├── shared/                      # Shared domain types, Zod schemas, Lunar engine
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── modules.ts               # Module Registry manifest & IDs
│   │   └── lunar/
│   │       ├── lunarCalendar.ts     # Thuật toán chuyển đổi Dương <-> Âm lịch VN
│   │       └── vnHolidays.ts        # Ngày lễ Dương lịch & Âm lịch Việt Nam
│   └── renderer/
│       ├── index.html               # Main App entry
│       ├── widget.html              # Floating Widget entry
│       └── src/
│           ├── main.tsx             # Main App bootstrap
│           ├── widget.tsx           # Floating Widget bootstrap
│           ├── core/
│           │   ├── db/              # Dexie local DB + repositories
│           │   ├── sync/            # Sync Engine (outbox queue, Supabase pull/push, conflict LWW)
│           │   ├── store/           # Zustand stores (auth, settings, modules, calendar date)
│           │   └── registry/        # Dynamic Module Loader (sidebar, routes, day-panel slots)
│           ├── components/          # Shared UI primitives & Layout shell
│           ├── modules/
│           │   ├── calendar/        # Month/Week/Day views, Event modal, Recurrence
│           │   ├── lunar-countdown/ # Lunar info panel, Countdown cards & widgets
│           │   ├── tasks-habits/    # To-do list, Habit matrix, Pomodoro timer
│           │   ├── daily-notes/     # Markdown daily journal & Mood tracker
│           │   ├── finance-goals/   # Daily income/expense ledger & Personal goals
│           │   └── settings-sync/   # Module toggles, Auth, Cloud Sync status, Backup/ICS
│           └── widget-ui/           # Giao diện gọn nhẹ cho Floating Desktop Widget
└── tests/                           # Vitest unit tests (lunar, recurrence, sync)
```

## Task Breakdown

### Phase 3: Solutioning (Design & Architecture — NO CODE)

- [x] **T0: Design Specification & Data Architecture**
  - **Agent:** `frontend-specialist` + `database-architect`
  - **Skills:** `design-spec`, `database-design`, `architecture`
  - **Priority:** P0 | **Dependencies:** User Plan Approval
  - **INPUT:** Yêu cầu người dùng + 5 nhóm module + Floating Widget + Cloud Sync
  - **OUTPUT:** `DESIGN.md` (color palette không tím/violet, typography, spacing, light/dark tokens, layout Main & Widget) + thiết kế ERD/Sync protocol (Last-Write-Wins với `updated_at`, `deleted_at` soft delete).
  - **VERIFY:** `DESIGN.md` có đủ token frontmatter & layout specs; mọi bảng dữ liệu có `id (UUID)`, `user_id`, `updated_at`, `deleted_at`, `sync_status`.

### Phase 4: Implementation — Milestone 1 (Foundation, Shell, Calendar, Lunar & Widget)

- [x] **T1: Scaffold Electron + Vite + React 19 + Tailwind v4 + IPC Foundation**
  - **Agent:** `frontend-specialist`
  - **Skills:** `app-builder`, `clean-code`, `tailwind-patterns`
  - **Priority:** P0 | **Dependencies:** T0
  - **INPUT:** `electron-desktop` template + `DESIGN.md`
  - **OUTPUT:** Cấu trúc `electron-vite` hoàn chỉnh (2 entry: `index.html` & `widget.html`), `preload` an toàn với `contextBridge`, config store, ESLint + TypeScript + Vitest config.
  - **VERIFY:** `npm run dev` mở được cửa sổ Main App không lỗi console; `npm run typecheck` pass.

- [x] **T2: Shared Data Layer (Dexie Offline DB + Module Registry + Sync Engine & Supabase Schema)**
  - **Agent:** `database-architect` + `backend-specialist`
  - **Skills:** `database-design`, `clean-code`
  - **Priority:** P0 | **Dependencies:** T1
  - **INPUT:** ERD từ T0
  - **OUTPUT:** `src/renderer/src/core/db/` (Dexie tables cho events, tasks, habits, habit_logs, notes, transactions, goals, countdowns), `src/shared/modules.ts` (Module Registry bật/tắt động), `src/renderer/src/core/sync/` (Supabase Auth + Push/Pull Sync Engine có Guest Offline fallback), và `supabase/schema.sql` (kèm RLS policies).
  - **VERIFY:** Unit test CRUD local & sync queue pass (`npm test`); bật/tắt module lưu bền vững qua reload.

- [x] **T3: Vietnamese Lunar Calendar Engine & Core Calendar Module**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`, `clean-code`, `testing-patterns`
  - **Priority:** P0 | **Dependencies:** T2
  - **INPUT:** Thuật toán Âm lịch VN + `DESIGN.md`
  - **OUTPUT:** `src/shared/lunar/` (chuyển đổi Dương–Âm, Can Chi, ngày lễ VN) + Module `calendar` (chế độ xem Tháng/Tuần/Ngày/Lịch biểu, hiển thị ngày âm song song trong từng ô lịch, CRUD sự kiện, lặp lại theo Dương lịch & Âm lịch, bộ lọc danh mục màu).
  - **VERIFY:** Unit test kiểm chứng các mốc Âm–Dương lịch chuẩn (Tết Nguyên Đán, Trung Thu, tháng nhuận) pass 100%; tạo/sửa/xóa sự kiện hiển thị ngay trên lưới lịch.

- [x] **T4: Floating Desktop Widget, System Tray & Native Windows Reminders**
  - **Agent:** `frontend-specialist`
  - **Skills:** `clean-code`, `frontend-design`
  - **Priority:** P1 | **Dependencies:** T3
  - **INPUT:** IPC layer + Calendar/Tasks local store
  - **OUTPUT:** `widgetWindow.ts` (cửa sổ frameless trong suốt/bo góc, kéo thả tự lưu tọa độ, nút Pin always-on-top, chỉnh độ mờ), `tray.ts` (thu xuống khay hệ thống, menu mở nhanh App/Widget), `notifications.ts` (bắn thông báo Windows trước sự kiện), `widget-ui/` (xem ngày Dương/Âm, sự kiện hôm nay, check nhanh To-do đồng bộ 2 chiều qua IPC).
  - **VERIFY:** Bật Widget từ App/Tray -> ghim nổi trên desktop -> tick hoàn thành việc trên Widget cập nhật ngay trong Main App và ngược lại.

### Phase 4: Implementation — Milestone 2 (Productivity & Journal Modules)

- [x] **T5: Tasks, Habit Tracker & Pomodoro Module**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`, `clean-code`
  - **Priority:** P1 | **Dependencies:** T2, T3
  - **INPUT:** Dexie repositories + Calendar Day Panel slot
  - **OUTPUT:** Module `tasks-habits`: To-do theo ngày/ưu tiên/trạng thái (hiện tích hợp trên lịch & Widget), Habit Tracker dạng lưới streak hằng ngày/tuần, bộ đếm Pomodoro (Focus/Break + thông báo hết phiên).
  - **VERIFY:** Tạo task gắn ngày -> hiện trong ô lịch & Widget; check-in habit cập nhật chuỗi streak; hoàn tất phiên Pomodoro phát thông báo.

- [x] **T6: Daily Notes (Markdown) & Mood Tracker Module**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`, `clean-code`
  - **Priority:** P1 | **Dependencies:** T2, T3
  - **INPUT:** Dexie `notes` table + Calendar Day Panel slot
  - **OUTPUT:** Module `daily-notes`: trình soạn thảo ghi chú Markdown theo từng ngày (preview/edit), chọn Mood hằng ngày (hiện chấm/icon nhỏ trên lịch tháng), tìm kiếm nhanh ghi chú.
  - **VERIFY:** Viết ghi chú + chọn tâm trạng cho 1 ngày -> chuyển ngày khác rồi quay lại vẫn giữ nguyên dữ liệu; tìm kiếm trả đúng kết quả.

### Phase 4: Implementation — Milestone 3 (Life-OS Modules & Sync Polish)

- [x] **T7: Personal Finance (Daily Ledger), Goals & Countdown Module**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`, `clean-code`
  - **Priority:** P2 | **Dependencies:** T2, T3
  - **INPUT:** Dexie `transactions`, `goals`, `countdowns` tables
  - **OUTPUT:** Module `finance-goals` (ghi chép thu/chi theo ngày, tổng kết tháng theo danh mục, bảng tiến độ mục tiêu cá nhân) + Module `lunar-countdown` (thẻ đếm ngược sự kiện Dương/Âm lịch, ghim lên đầu lịch/Widget).
  - **VERIFY:** Thêm khoản thu/chi -> số dư tháng tự cập nhật; tạo Countdown ngày Âm lịch tính đúng số ngày còn lại.

- [x] **T8: Settings, Module Manager, Cloud Sync UI & Backup (.ics / JSON)**
  - **Agent:** `frontend-specialist` + `security-auditor`
  - **Skills:** `clean-code`, `vulnerability-scanner`
  - **Priority:** P1 | **Dependencies:** T4, T5, T6, T7
  - **INPUT:** Toàn bộ 5 module + Sync Engine
  - **OUTPUT:** Giao diện Cài đặt tập trung: bật/tắt từng module, chuyển Light/Dark mode, đăng nhập/đăng ký Supabase & nút Sync thủ công + trạng thái đồng bộ realtime, xuất/nhập backup JSON & lịch `.ics`.
  - **VERIFY:** Tắt 1 module -> biến mất khỏi sidebar & day panel ngay lập tức; bật lại vẫn còn nguyên dữ liệu; xuất & nhập lại file JSON bảo toàn 100% bản ghi.

## Phase X: Final Verification

- [x] **Lint & Type Check:** `npm run lint` và `npm run typecheck` pass 0 lỗi, 0 cảnh báo.
- [x] **Unit Tests:** `npm test` (Vitest: 7 suites, 23/23 tests — Lunar engine, Recurrence, Sync LWW, Habit Streak, Markdown, Countdown, `.ics` Codec) pass 100%.
- [x] **Production Build:** `npm run build` (`electron-vite build`) đóng gói thành công không cảnh báo nghiêm trọng.
- [x] **Security Audit:** Cấu hình Electron đạt chuẩn (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, CSP nghiêm ngặt, không rò rỉ secret key, không dùng `dangerouslySetInnerHTML`, RLS trên đủ 8 bảng Supabase).
- [x] **Rule Compliance:** Không dùng mã màu tím/violet cấm; giao diện khớp `DESIGN.md`; trải nghiệm Desktop Widget + System Tray + Notifications hoàn thiện trên Windows.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (`0 errors, 0 warnings`)
- TypeScript: ✅ Pass (`tsconfig.node.json` + `tsconfig.web.json`)
- Tests: ✅ Pass (`23/23 tests`, 7 test suites)
- Security: ✅ No critical issues (Electron sandbox + CSP + Zod + RLS)
- Build: ✅ Success (`electron-vite build` in `5.41s`)
- Date: 2026-11-19

---

## 🎨 Feature Extension: Tùy chỉnh giao diện (Appearance Engine)
- [x] **Cỡ chữ (Font Size Scale):** Nhỏ (13px) / Vừa (14px - Mặc định) / Lớn (15.5px) / Rất lớn (17px) áp dụng toàn bộ ứng dụng qua CSS token `data-font-size`.
- [x] **Màu chủ đạo (Primary Accent):** Bảng màu 18 màu tuyển chọn (Đỏ Son, Ruby, Đất Nung, Hổ Phách, Vàng Nghệ, Xanh Rêu, Xanh Lá, Ngọc Bích, Mòng Két, Xanh Lam, Biển Xanh, Hoàng Gia, Xám Khói, Than Chì, Đen Onyx, San Hô, Hồng Đào, Gỗ Ấm) tuân thủ nghiêm ngặt quy tắc loại trừ tím/purple.
- [x] **8 Bộ giao diện (Themes):** Mặc định (Đỏ Son Cổ Điển), Sáng (Trắng Tinh Khôi), Tối (Đêm Obsidian), Dark (Huyền Bí Midnight), Aurora (Bắc Cực Quang), Ocean (Biển Bắc Nordic), Sunset (Giấy Kem Hoàng Hôn), Mono (Đơn Sắc Tối Giản).
- [x] **Kiểu nút bấm (Button Radius):** Bo vừa (8px) / Viên thuốc (Pill - 9999px) / Góc vuông (Sharp - 0px).
- [x] **Live Sync & Persistence:** Lưu vào Electron Store và đồng bộ 2 chiều tức thì với Floating Desktop Widget (Auto-save thời gian thực, không cần nút bấm thủ công).
- [x] **Thao tác tinh gọn:** Nút "Đặt lại mặc định" dạng compact đặt khéo léo tại góc tiêu đề, loại bỏ hoàn toàn thanh nút bấm cồng kềnh phía dưới.
- [x] **Hệ thống 21 màu sắc tuyển chọn:** Tích hợp trọn vẹn 21 màu chủ đạo (`MAU_CHINH`) từ `MauGiaoDien` (`RiengScript.html`).
- [x] **Hộp tìm kiếm nhanh Ctrl + K (Command Palette):** Tìm kiếm không dấu tiếng Việt xuyên suốt toàn bộ sự kiện, việc cần làm, mục tiêu, module điều hướng và phím tắt thao tác nhanh.
- [x] **Cải tiến Sidebar:** Nhóm module theo cấp bậc (`LỊCH & THỜI GIAN`, `CÔNG VIỆC & THÓI QUEN`, `CÁ NHÂN & TÀI CHÍNH`), vạch ngăn cách mờ `26x1px` khi thu gọn và ô mở nhanh tìm kiếm `Ctrl K`.
