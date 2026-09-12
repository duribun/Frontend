import type { Mood, Weather } from '@/lib/api';

export const WEATHER_OPTIONS: { value: Weather; label: string; emoji: string }[] = [
  { value: 'CLEAR', label: '맑음', emoji: '☀️' },
  { value: 'CLOUDY', label: '흐림', emoji: '☁️' },
  { value: 'RAIN', label: '비', emoji: '🌧️' },
  { value: 'SNOW', label: '눈', emoji: '❄️' },
  { value: 'THUNDER', label: '천둥번개', emoji: '⛈️' },
  { value: 'WIND', label: '바람', emoji: '💨' },
];

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'EXCITED', label: '신남', emoji: '🤩' },
  { value: 'HAPPY', label: '행복', emoji: '😊' },
  { value: 'NEUTRAL', label: '보통', emoji: '😐' },
  { value: 'SAD', label: '슬픔', emoji: '😢' },
  { value: 'DISTRESSED', label: '힘듦', emoji: '😣' },
];

export function weatherEmoji(weather: Weather): string {
  return WEATHER_OPTIONS.find((option) => option.value === weather)?.emoji ?? '☀️';
}

export function weatherLabel(weather: Weather): string {
  return WEATHER_OPTIONS.find((option) => option.value === weather)?.label ?? weather;
}

export function moodEmoji(mood: Mood): string {
  return MOOD_OPTIONS.find((option) => option.value === mood)?.emoji ?? '😐';
}
