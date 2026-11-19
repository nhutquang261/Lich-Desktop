export type ThemePresetId =
  | 'vermilion-light'
  | 'pure-light'
  | 'obsidian-dark'
  | 'midnight-dark'
  | 'aurora-night'
  | 'nordic-sea'
  | 'vintage-paper'
  | 'monochrome'
  | 'jade-forest'
  | 'forest-night'

export interface ThemePreset {
  id: ThemePresetId
  name: string
  subtitle: string
  description: string
  colorScheme: 'light' | 'dark'
  preview: {
    canvas: string
    surface: string
    border: string
    ink: string
    accent: string
    secondary: string
  }
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'vermilion-light',
    name: 'Mặc định',
    subtitle: 'Nền Dịu Trang Nhã',
    description: 'Nền dịu mềm mại, viền thanh thoát, phong cách hài hòa chuẩn mẫu Rieng.',
    colorScheme: 'light',
    preview: {
      canvas: '#F5F7FC',
      surface: '#FFFFFF',
      border: '#D5DBE8',
      ink: '#1F2937',
      accent: '#4A7BD0',
      secondary: '#16A34A'
    }
  },
  {
    id: 'pure-light',
    name: 'Sáng',
    subtitle: 'Trắng Tinh Khôi',
    description: 'Phong cách tối giản, mặt phẳng sáng tinh tươm và thanh lịch.',
    colorScheme: 'light',
    preview: {
      canvas: '#FFFFFF',
      surface: '#FFFFFF',
      border: '#D5D9E0',
      ink: '#1F2937',
      accent: '#1E96F0',
      secondary: '#0D9488'
    }
  },
  {
    id: 'obsidian-dark',
    name: 'Tối',
    subtitle: 'Đêm Than Chì',
    description: 'Chế độ tối than chì bảo vệ mắt, độ tương phản sắc nét dịu mắt.',
    colorScheme: 'dark',
    preview: {
      canvas: '#1C2120',
      surface: '#131716',
      border: '#4A524F',
      ink: '#F2F4F7',
      accent: '#3AA39B',
      secondary: '#10B981'
    }
  },
  {
    id: 'midnight-dark',
    name: 'Dark',
    subtitle: 'Huyền Bí Midnight',
    description: 'Nền đen sâu tuyệt đối OLED, điểm nhấn xanh bạc hà rực sáng.',
    colorScheme: 'dark',
    preview: {
      canvas: '#0A0B0F',
      surface: '#12141A',
      border: '#22262F',
      ink: '#F4F4F5',
      accent: '#34D399',
      secondary: '#2563EB'
    }
  },
  {
    id: 'aurora-night',
    name: 'Aurora',
    subtitle: 'Bắc Cực Quang',
    description: 'Sắc tím ngọc huyền ảo trên nền đêm sâu thẳm lung linh.',
    colorScheme: 'dark',
    preview: {
      canvas: '#12142E',
      surface: '#1F224A',
      border: '#383E72',
      ink: '#EAEBFF',
      accent: '#7A4DF7',
      secondary: '#0FA8A0'
    }
  },
  {
    id: 'nordic-sea',
    name: 'Ocean',
    subtitle: 'Biển Bắc Nordic',
    description: 'Mát mẻ, sâu lắng với thanh bên navy đại dương Bắc Âu.',
    colorScheme: 'light',
    preview: {
      canvas: '#EEF4FB',
      surface: '#FFFFFF',
      border: '#C3D3E8',
      ink: '#0B2545',
      accent: '#1D6FE5',
      secondary: '#0F766E'
    }
  },
  {
    id: 'vintage-paper',
    name: 'Sunset',
    subtitle: 'Giấy Kem Hoàng Hôn',
    description: 'Ấm áp kiểu sổ tay ghi chú bìa da & ánh hoàng hôn cam đất dịu nhẹ.',
    colorScheme: 'light',
    preview: {
      canvas: '#FBF5EC',
      surface: '#FFFDF9',
      border: '#E0CDB3',
      ink: '#241F1A',
      accent: '#D9480F',
      secondary: '#F6EBDC'
    }
  },
  {
    id: 'monochrome',
    name: 'Mono',
    subtitle: 'Đơn Sắc Tối Giản',
    description: 'Bản phối đen trắng thuần khiết chuẩn Swiss Design, không phân tâm.',
    colorScheme: 'light',
    preview: {
      canvas: '#F3F3EF',
      surface: '#FFFFFF',
      border: '#111111',
      ink: '#111111',
      accent: '#111111',
      secondary: '#555555'
    }
  },
  {
    id: 'jade-forest',
    name: 'Rừng Jade',
    subtitle: 'Xanh Ngọc Tươi Mát',
    description: 'Dịu mắt, tươi mới với sắc xanh ngọc bích & nền lá nhạt.',
    colorScheme: 'light',
    preview: {
      canvas: '#F1F6F4',
      surface: '#FFFFFF',
      border: '#D4E4DD',
      ink: '#0F221C',
      accent: '#0D7A5F',
      secondary: '#15803D'
    }
  },
  {
    id: 'forest-night',
    name: 'Rừng Đêm',
    subtitle: 'Rêu Tối Tĩnh Lặng',
    description: 'Nền xanh rêu tối sâu lắng kết hợp điểm nhấn ngọc lục bảo.',
    colorScheme: 'dark',
    preview: {
      canvas: '#09110E',
      surface: '#111D19',
      border: '#20352E',
      ink: '#EBF5F0',
      accent: '#10B981',
      secondary: '#34D399'
    }
  }
] as const

export const DEFAULT_THEME_PRESET: ThemePresetId = 'vermilion-light'

export function getThemePreset(id: string | undefined): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0]
}

export interface AccentColorSwatch {
  id: string
  name: string
  hex: string
}

// Full 21 accent colors matching MauGiaoDien (RiengScript.html - MAU_CHINH)
export const ACCENT_COLOR_SWATCHES: readonly AccentColorSwatch[] = [
  { id: 'blue', name: 'Xanh biển', hex: '#4A7BD0' },
  { id: 'plum', name: 'Tím mận', hex: '#B060A4' },
  { id: 'lime', name: 'Xanh cốm', hex: '#7FAE2E' },
  { id: 'sky', name: 'Xanh trời', hex: '#1E96F0' },
  { id: 'lavender', name: 'Tím oải hương', hex: '#8A6BC1' },
  { id: 'jade', name: 'Xanh ngọc', hex: '#3AA39B' },
  { id: 'pink', name: 'Hồng', hex: '#DD5293' },
  { id: 'gray', name: 'Xám', hex: '#6B7280' },
  { id: 'indigo', name: 'Xanh chàm', hex: '#6D7FE0' },
  { id: 'peach', name: 'Cam đào', hex: '#E0875A' },
  { id: 'moss', name: 'Xanh rêu', hex: '#5F8A7E' },
  { id: 'olive', name: 'Ô liu', hex: '#8F9E5E' },
  { id: 'purple-navy', name: 'Tím than', hex: '#7568B8' },
  { id: 'green', name: 'Xanh lá', hex: '#2FB457' },
  { id: 'gold', name: 'Vàng', hex: '#E6B800' },
  { id: 'steel', name: 'Xanh thép', hex: '#56739C' },
  { id: 'aurora', name: 'Tím Aurora', hex: '#7A4DF7' },
  { id: 'ocean', name: 'Xanh Ocean', hex: '#1D6FE5' },
  { id: 'terracotta', name: 'Cam đất', hex: '#D9480F' },
  { id: 'black', name: 'Đen', hex: '#111111' },
  { id: 'mint', name: 'Xanh bạc hà', hex: '#34D399' }
] as const
