import {
  Smiley,
  SmileyMeh,
  SmileyNervous,
  SmileySad,
  SmileyWink
} from '@phosphor-icons/react'
import type { DailyNote } from '@shared/types'

export type MoodValue = NonNullable<DailyNote['mood']>

export const MOOD_OPTIONS: ReadonlyArray<{
  value: MoodValue
  label: string
  color: string
  Icon: typeof Smiley
}> = [
  { value: 'great', label: 'Tuyệt vời', color: '#0D7A5F', Icon: SmileyWink },
  { value: 'good', label: 'Vui vẻ', color: '#0F766E', Icon: Smiley },
  { value: 'neutral', label: 'Bình thường', color: '#64748B', Icon: SmileyMeh },
  { value: 'low', label: 'Mệt mỏi', color: '#C67D08', Icon: SmileySad },
  { value: 'stressed', label: 'Căng thẳng', color: '#D9381E', Icon: SmileyNervous }
]

export function getMoodMeta(mood: DailyNote['mood']) {
  if (!mood) return null
  return MOOD_OPTIONS.find((m) => m.value === mood) ?? null
}
