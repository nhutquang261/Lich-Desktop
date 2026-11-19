---
version: "1.0"
name: Lich Studio — Vermilion & Ink
description: High-contrast architectural desktop calendar and Life-OS design system inspired by modern Swiss grids and traditional Vietnamese vermilion calendars.
colors:
  primary: "#D9381E"
  primary-hover: "#B92B14"
  primary-soft: "#FCECE9"
  secondary: "#0D7A5F"
  tertiary: "#C67D08"
  neutral: "#111315"
  surface: "#FFFFFF"
  surface-subtle: "#F6F7F9"
  surface-border: "#E2E5EA"
  on-surface: "#111315"
  on-surface-muted: "#5A6270"
  dark-canvas: "#0D0F12"
  dark-surface: "#15181E"
  dark-surface-elevated: "#1C2028"
  dark-border: "#262B35"
  dark-on-surface: "#F2F4F7"
  dark-on-surface-muted: "#8E96A4"
  error: "#C81E1E"
typography:
  headline-display:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.02em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  lg: 10px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xs}"
    padding: 8px
  button-secondary:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xs}"
    padding: 8px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xs}"
    padding: 8px
  calendar-cell:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: 6px
  widget-shell:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-on-surface}"
    rounded: "{rounded.lg}"
    padding: 12px
---

# Lịch Studio — Vermilion & Ink

## Overview

A crisp, architectural desktop calendar and modular Life-OS workspace tailored for Vietnamese users. Inspired by Swiss typographic precision (Cal.com, Sanity) paired with the cultural warmth of traditional Vietnamese vermilion-and-ink calendars. Built for daily high-frequency desktop usage: instant scanability of solar and lunar dates, keyboard-first interactions, zero visual clutter, and a compact Floating Desktop Widget that feels native to Windows.

## Colors

- **Signal Vermilion (`primary` `#D9381E`):** The sole primary accent. Reserved for Today highlights, primary creation actions (`+ Sự kiện`), active navigation markers, and Vietnamese Lunar auspicious days (Mùng 1, Rằm, Tết).
- **Deep Jade (`secondary` `#0D7A5F`):** Positive completion states (checked tasks, habit streaks, Cloud Sync healthy status, income figures).
- **Warm Amber (`tertiary` `#C67D08`):** Reminders, pending offline sync queue, and upcoming deadline badges.
- **Architectural Neutrals (`surface`, `surface-subtle`, `surface-border`, `dark-canvas`, `dark-surface`):** Strictly cool-neutral ink and paper hierarchy so colored event tags and lunar annotations pop with zero visual noise.
- **Strict Prohibition:** No purple, violet, indigo, or neon gradients anywhere in the UI. Event categories use curated non-purple tones: Vermilion `#D9381E`, Jade `#0D7A5F`, Amber `#C67D08`, Slate `#334155`, Terracotta `#C2410C`, Teal `#0F766E`, Crimson `#BE123C`.
- **Theme Presets (6 Curated Themes, synchronized across Main App & Floating Desktop Widget via `[data-theme]`):**
  1. `vermilion-light` (Đỏ Son Cổ Điển — Light): `#FFFFFF` / `#F6F7F9` + `#D9381E`
  2. `jade-forest` (Rừng Xanh Jade — Light): `#FFFFFF` / `#F1F6F4` + `#0D7A5F`
  3. `vintage-paper` (Giấy Kem Hoài Cổ — Light): `#FCF9F2` / `#F3EDE0` + `#B9381C`
  4. `nordic-sea` (Biển Bắc Nordic — Light): `#FFFFFF` / `#F0F5FA` + `#0369A1`
  5. `obsidian-dark` (Đêm Obsidian — Dark): `#15181E` / `#0D0F12` + `#EF4B30`
  6. `forest-night` (Rừng Đêm Tĩnh Lặng — Dark): `#111D19` / `#09110E` + `#10B981`

## Typography

- **Primary UI Font (`Be Vietnam Pro`):** Self-hosted locally (`@fontsource/be-vietnam-pro`) for 100% offline reliability and crisp rendering of Vietnamese diacritics at every size.
- **Numeric & Technical Font (`JetBrains Mono`):** Self-hosted (`@fontsource/jetbrains-mono`) with `tabular-nums` for calendar day numbers, Lunar dates (`15/10`), clock/event times (`09:30`), and countdown figures.

## Layout

- **Main Window (Asymmetric 3-Zone Desktop Shell):**
  1. **Compact Rail Sidebar (`220px` collapsible to `56px`):** Brand mark, dynamic Module Registry navigation (updates live when modules are toggled), mini Lunar summary for today, Floating Widget toggle, and Sync status footer.
  2. **Primary Stage (`1fr`):** Full-bleed architectural calendar grid (Month / Week / Day / Agenda views) with hairline `1px` cell borders (`rounded.none`).
  3. **Contextual Day Inspector Drawer (`320px` right panel):** Displays full Vietnamese Lunar breakdown (Âm lịch, Can Chi ngày/tháng/năm, ngày lễ), events for the selected date, and future module slots (Tasks, Daily Notes, Finance) attached to the selected day.
- **Floating Desktop Widget (`340px × 440px`, resizable/draggable):**
  - Frameless native-feel floating card with custom drag handle header, Pin (Always-on-top) toggle, opacity cycle, open Main App button, Today Solar/Lunar hero strip, Today's Events list, and Quick To-do checklist synced live with Main Window via IPC.

## Elevation & Depth

- **Main App:** Flat architectural precision — depth communicated via tonal surface shifts (`surface-subtle` vs `surface`) and crisp `1px` solid borders (`surface-border` / `dark-border`). No blurry glassmorphism or drop-shadow soup inside the grid.
- **Modals & Floating Widget:** Single crisp tinted elevation shadow (`0 16px 40px -12px rgba(17, 19, 21, 0.28)`) paired with a `1px` solid border so floating surfaces separate cleanly over any desktop wallpaper.

## Shapes

- **Strict Geometry Contract:**
  - `0px` (`rounded.none`): Calendar grid cells and structural panel dividers.
  - `2px` (`rounded.xs`): Buttons, inputs, event pills, badges, segmented controls (crisp technical precision — avoiding generic `6px-8px` SaaS softness).
  - `10px` (`rounded.lg`): Detached overlays only (Event/Settings Modals and the Floating Desktop Widget outer frame).
  - `9999px` (`rounded.full`): Status indicator dots and Today circular date marker.

## Components

- **Iconography:** `@phosphor-icons/react` exclusively (`size={16}` for controls, `size={18}` for navigation, `weight="regular"` default, `weight="fill"` for active/pinned states). Zero emojis in functional UI chrome.
- **Buttons:** Tactile active press (`active:scale-[0.98]`), single-line labels, minimum WCAG AA contrast (4.5:1).
- **Event Pills:** Left `3px` category color bar + soft tinted fill + crisp `JetBrains Mono` time prefix + truncated title. Lunar-recurring events carry a subtle moon glyph.
- **Forms:** Label strictly above input, helper/validation message below, clear focus outline (`2px solid var(--color-primary)`).

## Do's and Don'ts

- **Do** show Solar and Vietnamese Lunar dates together in every calendar cell with clear visual hierarchy (bold Solar top-left, compact monospace Lunar top-right; vermilion tint on Mùng 1 & Rằm).
- **Do** honor `prefers-reduced-motion` and keep transitions crisp (`150ms cubic-bezier(0.2, 0.8, 0.2, 1)`).
- **Don't** use purple/violet/indigo hex codes anywhere in tokens, categories, or themes.
- **Don't** mix icon libraries or hand-draw decorative SVG illustrations.
- **Don't** block user actions waiting for network/cloud sync — all mutations write locally first with optimistic UI.
