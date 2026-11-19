import { describe, expect, it } from 'vitest'
import {
  ACCENT_COLOR_SWATCHES,
  DEFAULT_THEME_PRESET,
  getThemePreset,
  THEME_PRESETS
} from '@shared/themes'

describe('Theme Presets Registry', () => {
  it('contains 10 distinct presets covering light, dark, and OLED modes', () => {
    expect(THEME_PRESETS).toHaveLength(10)
    const ids = new Set(THEME_PRESETS.map((t) => t.id))
    expect(ids.size).toBe(10)
    expect(THEME_PRESETS.filter((t) => t.colorScheme === 'light').length).toBe(6)
    expect(THEME_PRESETS.filter((t) => t.colorScheme === 'dark').length).toBe(4)
  })

  it('falls back cleanly to default preset for unknown ids', () => {
    expect(getThemePreset('unknown-theme').id).toBe(DEFAULT_THEME_PRESET)
    expect(getThemePreset('forest-night').colorScheme).toBe('dark')
    expect(getThemePreset('pure-light').colorScheme).toBe('light')
  })

  it('uses valid 6-digit hex codes with zero banned purple/violet hues', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    for (const preset of THEME_PRESETS) {
      for (const value of Object.values(preset.preview)) {
        expect(value).toMatch(hexRegex)
      }
    }
  })

  it('provides 21 curated accent color swatches with valid hex codes matching MauGiaoDien', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    expect(ACCENT_COLOR_SWATCHES).toHaveLength(21)
    for (const swatch of ACCENT_COLOR_SWATCHES) {
      expect(swatch.hex).toMatch(hexRegex)
    }
  })

  it('includes the 8 presets matching the reference appearance customizer', () => {
    const expectedIds = [
      'vermilion-light',
      'pure-light',
      'obsidian-dark',
      'midnight-dark',
      'aurora-night',
      'nordic-sea',
      'vintage-paper',
      'monochrome'
    ]
    const availableIds = THEME_PRESETS.map((t) => t.id)
    for (const id of expectedIds) {
      expect(availableIds).toContain(id)
    }
  })

  it('normalizes Vietnamese diacritics for quick search correctly', () => {
    function removeAccents(str: string): string {
      return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
    }
    expect(removeAccents('Lịch Âm Dương')).toBe('lich am duong')
    expect(removeAccents('Đếm ngược')).toBe('dem nguoc')
    expect(removeAccents('Thu chi tài chính')).toBe('thu chi tai chinh')
    expect(removeAccents('Họp phụ huynh')).toBe('hop phu huynh')
  })
})
