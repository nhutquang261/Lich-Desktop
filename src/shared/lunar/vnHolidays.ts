import type { LunarDateInfo } from './lunarCalendar'

export interface VnHoliday {
  name: string
  isPublicHoliday: boolean
  isLunar: boolean
}

const SOLAR_HOLIDAYS: Record<string, VnHoliday> = {
  '1-1': { name: 'Tết Dương lịch', isPublicHoliday: true, isLunar: false },
  '14-2': { name: 'Lễ Tình nhân', isPublicHoliday: false, isLunar: false },
  '8-3': { name: 'Quốc tế Phụ nữ', isPublicHoliday: false, isLunar: false },
  '30-4': { name: 'Giải phóng miền Nam', isPublicHoliday: true, isLunar: false },
  '1-5': { name: 'Quốc tế Lao động', isPublicHoliday: true, isLunar: false },
  '1-6': { name: 'Quốc tế Thiếu nhi', isPublicHoliday: false, isLunar: false },
  '2-9': { name: 'Quốc khánh Việt Nam', isPublicHoliday: true, isLunar: false },
  '20-10': { name: 'Phụ nữ Việt Nam', isPublicHoliday: false, isLunar: false },
  '20-11': { name: 'Nhà giáo Việt Nam', isPublicHoliday: false, isLunar: false },
  '24-12': { name: 'Đêm Giáng sinh', isPublicHoliday: false, isLunar: false },
  '25-12': { name: 'Lễ Giáng sinh', isPublicHoliday: false, isLunar: false }
}

const LUNAR_HOLIDAYS: Record<string, VnHoliday> = {
  '1-1': { name: 'Mùng 1 Tết Nguyên Đán', isPublicHoliday: true, isLunar: true },
  '2-1': { name: 'Mùng 2 Tết Nguyên Đán', isPublicHoliday: true, isLunar: true },
  '3-1': { name: 'Mùng 3 Tết Nguyên Đán', isPublicHoliday: true, isLunar: true },
  '15-1': { name: 'Tết Nguyên Tiêu (Rằm tháng Giêng)', isPublicHoliday: false, isLunar: true },
  '3-3': { name: 'Tết Hàn Thực', isPublicHoliday: false, isLunar: true },
  '10-3': { name: 'Giỗ Tổ Hùng Vương', isPublicHoliday: true, isLunar: true },
  '15-4': { name: 'Lễ Phật Đản', isPublicHoliday: false, isLunar: true },
  '5-5': { name: 'Tết Đoan Ngọ', isPublicHoliday: false, isLunar: true },
  '15-7': { name: 'Lễ Vu Lan', isPublicHoliday: false, isLunar: true },
  '15-8': { name: 'Tết Trung Thu', isPublicHoliday: false, isLunar: true },
  '23-12': { name: 'Ông Công Ông Táo', isPublicHoliday: false, isLunar: true }
}

export function getVietnameseHolidays(
  solarDay: number,
  solarMonth: number,
  lunar: LunarDateInfo
): VnHoliday[] {
  const results: VnHoliday[] = []
  const solarKey = `${solarDay}-${solarMonth}`
  if (SOLAR_HOLIDAYS[solarKey]) {
    results.push(SOLAR_HOLIDAYS[solarKey])
  }
  if (!lunar.isLeapMonth) {
    const lunarKey = `${lunar.day}-${lunar.month}`
    if (LUNAR_HOLIDAYS[lunarKey]) {
      results.push(LUNAR_HOLIDAYS[lunarKey])
    }
  }
  return results
}
